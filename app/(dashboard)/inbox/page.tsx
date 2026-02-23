"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
    Search, Bot, User, CheckCircle2, Send,
    MessageSquare, Image as ImageIcon, Video,
    Inbox as InboxIcon, MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

type Conversation = {
    id: string;
    workspace_id: string;
    subscriber_id: string;
    status: 'open' | 'resolved';
    mode: 'bot' | 'human';
    last_message_preview: string;
    last_message_at: string;
    unread_count: number;
    username: string;
    profile_pic_url: string;
    ig_user_id: string;
};

type Message = {
    id: string;
    conversation_id: string;
    workspace_id: string;
    direction: 'inbound' | 'outbound';
    message_type: 'text' | 'image' | 'video' | 'quick_reply';
    content: string;
    created_at: string;
};

export default function InboxPage() {
    const supabase = createClient();
    const { workspaceId, loading: workspaceLoading } = useWorkspace();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

    const [filter, setFilter] = useState<'all' | 'bot' | 'human' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');

    const [loadingConv, setLoadingConv] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch Conversations
    const fetchConversations = async () => {
        if (!workspaceId) return;
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
          *,
          subscribers ( username, profile_pic_url, ig_user_id )
        `)
                .eq('workspace_id', workspaceId)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            const formatted = (data || []).map(conv => ({
                ...conv,
                username: conv.subscribers?.username || 'Unknown',
                profile_pic_url: conv.subscribers?.profile_pic_url,
                ig_user_id: conv.subscribers?.ig_user_id
                // removing subscribers object from top level
            }));
            setConversations(formatted);
        } catch (err: any) {
            console.error('Failed to fetch conversations:', err);
            toast.error('Failed to load inbox');
        } finally {
            setLoadingConv(false);
        }
    };

    // Initial Load & Subscription for Conversations
    useEffect(() => {
        if (workspaceId) {
            fetchConversations();

            const convChannel = supabase
                .channel('conversations:workspace')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'conversations',
                        filter: `workspace_id=eq.${workspaceId}`
                    },
                    () => {
                        fetchConversations();
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(convChannel); };
        }
    }, [workspaceId]);

    // Fetch Messages & Subscribe
    useEffect(() => {
        if (!selectedConvId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', selectedConvId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setMessages(data || []);
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setLoadingMessages(false);
                scrollToBottom();
            }
        };

        fetchMessages();

        // Reset unread count
        supabase.from('conversations').update({ unread_count: 0 }).eq('id', selectedConvId).then(() => {
            setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, unread_count: 0 } : c));
        });

        const msgChannel = supabase
            .channel(`messages:${selectedConvId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConvId}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(msgChannel); };
    }, [selectedConvId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConvId || !workspaceId) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await supabase.from('messages').insert({
                conversation_id: selectedConvId,
                workspace_id: workspaceId,
                direction: 'outbound',
                message_type: 'text',
                content: content
            });

            if (error) throw error;

            // Update conversation preview and time
            await supabase.from('conversations').update({
                last_message_preview: content,
                last_message_at: new Date().toISOString()
            }).eq('id', selectedConvId);

        } catch (err) {
            console.error('Failed to send message:', err);
            toast.error('Failed to send message');
            setNewMessage(content); // Restore message
        }
    };

    const toggleMode = async (convId: string, currentMode: string) => {
        const newMode = currentMode === 'bot' ? 'human' : 'bot';
        try {
            const { error } = await supabase
                .from('conversations')
                .update({ mode: newMode })
                .eq('id', convId);
            if (error) throw error;
            toast.success(`Switched to ${newMode === 'human' ? 'Human' : 'Bot'} mode`);
        } catch (err) {
            console.error('Mode switch failed:', err);
            toast.error('Failed to switch mode');
        }
    };

    const resolveConversation = async (convId: string) => {
        try {
            const { error } = await supabase
                .from('conversations')
                .update({ status: 'resolved' })
                .eq('id', convId);
            if (error) throw error;
            toast.success('Conversation resolved');
        } catch (err) {
            toast.error('Failed to resolve conversation');
        }
    };

    // Processing display data
    const filteredConversations = conversations.filter(c => {
        if (searchQuery && !c.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filter === 'bot' && c.mode !== 'bot') return false;
        if (filter === 'human' && c.mode !== 'human') return false;
        if (filter === 'unread' && c.unread_count === 0) return false;
        return true;
    });

    const selectedConv = conversations.find(c => c.id === selectedConvId);

    if (workspaceLoading) return <div className="h-[calc(100vh-64px)] flex items-center justify-center">Loading Workspace...</div>;

    return (
        <div className="h-[calc(100vh-64px)] w-full flex overflow-hidden border border-border rounded-xl shadow-2xl bg-bg -mx-4 sm:mx-0 sm:w-auto">

            {/* ---------------- LEFT PANEL ---------------- */}
            <div className={`w-full sm:w-[320px] bg-[#12121a] border-r border-border flex flex-col shrink-0 ${selectedConvId ? 'hidden sm:flex' : 'flex'}`}>

                <div className="p-4 border-b border-border space-y-4">
                    <div className="relative">
                        <Search className="w-4 h-4 text-text2 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface2 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        {(['all', 'bot', 'human', 'unread'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-surface2 text-text2 hover:bg-surface border border-transparent'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                            <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center mb-4 text-3xl">📭</div>
                            <h3 className="font-semibold mb-1">No conversations yet</h3>
                            <p className="text-sm text-text2 leading-relaxed">
                                When Instagram users DM your connected account, conversations will appear here
                            </p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConvId(conv.id)}
                                className={`p-4 border-b border-border hover:bg-surface2 cursor-pointer transition-colors relative flex items-start gap-3 ${selectedConvId === conv.id ? 'bg-surface2 border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    {conv.profile_pic_url ? (
                                        <img src={conv.profile_pic_url} alt={conv.username} className="w-12 h-12 rounded-full object-cover border border-border" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-lg font-bold text-accent">
                                            {conv.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#12121a] flex items-center justify-center ${conv.mode === 'bot' ? 'bg-green-500' : 'bg-orange-500'
                                        }`}>
                                        {conv.mode === 'bot' ? <Bot className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-white" />}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium truncate pr-2">@{conv.username}</span>
                                        <span className="text-xs text-text2 whitespace-nowrap">
                                            {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }).replace('about ', '') : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-text font-medium' : 'text-text2'}`}>
                                            {conv.last_message_preview || 'No messages yet'}
                                        </p>
                                        {conv.unread_count > 0 && (
                                            <span className="w-5 h-5 flex items-center justify-center bg-accent text-white text-[10px] font-bold rounded-full shrink-0">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ---------------- RIGHT PANEL ---------------- */}
            <div className={`flex-1 bg-[#0a0a0f] flex flex-col ${!selectedConvId ? 'hidden sm:flex' : 'flex'}`}>
                {!selectedConvId || !selectedConv ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mb-6 shadow-xl">
                            <MessageSquare className="w-10 h-10 text-accent" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Select a conversation</h2>
                        <p className="text-text2 max-w-sm">
                            Choose a conversation from the left to start viewing messages and manually replying to users.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat Top Bar */}
                        <div className="h-16 px-6 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <button className="sm:hidden p-2 -ml-2 text-text2 hover:text-text" onClick={() => setSelectedConvId(null)}>
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                {selectedConv.profile_pic_url ? (
                                    <img src={selectedConv.profile_pic_url} alt={selectedConv.username} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center font-bold text-accent">
                                        {selectedConv.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold leading-tight">@{selectedConv.username}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`w-2 h-2 rounded-full ${selectedConv.status === 'open' ? 'bg-green-500' : 'bg-text2'}`}></span>
                                        <span className="text-xs text-text2 capitalize">{selectedConv.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleMode(selectedConv.id, selectedConv.mode)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${selectedConv.mode === 'bot'
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                                            : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                                        }`}
                                >
                                    {selectedConv.mode === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    {selectedConv.mode === 'bot' ? 'Bot Mode' : 'Human Mode'}
                                </button>
                                {selectedConv.status === 'open' && (
                                    <button
                                        onClick={() => resolveConversation(selectedConv.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface2 hover:bg-surface border border-border rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-text2" />
                                        <span className="hidden md:inline">Resolve</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
                            {loadingMessages ? (
                                <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent border-r-transparent rounded-full animate-spin"></div></div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-text2 text-sm">No messages in this conversation yet.</div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isOutbound = msg.direction === 'outbound';
                                    return (
                                        <div key={msg.id || i} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                                                <div
                                                    className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${isOutbound
                                                            ? 'bg-accent text-white rounded-tr-sm'
                                                            : 'bg-[#1a1a26] border border-border text-text rounded-tl-sm'
                                                        }`}
                                                >
                                                    {msg.message_type === 'image' && <ImageIcon className="w-5 h-5 mb-2 opacity-80" />}
                                                    {msg.message_type === 'video' && <Video className="w-5 h-5 mb-2 opacity-80" />}
                                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap breaks-words">{msg.content}</p>
                                                </div>
                                                <span className="text-[11px] text-text2 mt-1.5 px-1 font-medium select-none">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Bottom Input Area */}
                        <div className="p-4 bg-surface border-t border-border shrink-0">
                            {selectedConv.mode === 'bot' ? (
                                <div className="bg-surface2 border border-border rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Bot className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium text-text">Bot is handling this conversation.</p>
                                            <p className="text-xs text-text2">Switch to Human mode to reply manually.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleMode(selectedConv.id, selectedConv.mode)}
                                        className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Take Over
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
                                    <div className="flex-1 relative bg-[#12121a] border border-border rounded-2xl focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all overflow-hidden flex items-end min-h-[52px]">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full bg-transparent resize-none outline-none py-3.5 pl-4 pr-12 text-[15px] max-h-32 min-h-[52px]"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                        />
                                        <div className="absolute right-2 bottom-2">
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                className="w-9 h-9 flex items-center justify-center bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent text-white rounded-full transition-colors"
                                            >
                                                <Send className="w-4 h-4 ml-0.5" />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
