import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Mic } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatApi } from '../services/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

export function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'assistant', text: 'Hi! I can search your inbox. Ask me anything, like "What tasks are due?"' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const toggleListening = () => {
        if (isListening) {
            // Stop logical state, the API handles stop automatically often or we can force it
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Voice commands are not supported in this browser. Please use Chrome/Edge.' }]);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Optional: Auto-send
            // handleSend();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await chatApi.sendMessage(userMsg.text);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: data.response
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat failed', error);
            setMessages(prev => [...prev, { id: 'error', role: 'assistant', text: 'Sorry, I couldn\'t connect to the AI.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 p-3.5 bg-primary hover:bg-primary/90 text-white rounded-full shadow-xl shadow-primary/20 transition-all z-50 flex items-center justify-center transform active:scale-95 hover:-translate-y-0.5"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>

            {/* Chat Window */}
            <div className={cn(
                "fixed bottom-24 right-6 w-96 h-[500px] bg-background border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}>
                {/* Header */}
                <div className="p-4 bg-surface/50 border-b border-border flex items-center gap-2 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="font-semibold text-text-primary">Inbox Assistant</h3>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-primary text-white rounded-br-sm"
                                    : "bg-surface border border-border text-text-primary rounded-bl-sm"
                            )}>
                                {msg.text}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-surface-highlight flex items-center justify-center shrink-0 border border-border">
                                    <User className="w-4 h-4 text-text-secondary" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-surface border border-border p-4 rounded-2xl rounded-bl-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce delay-100" />
                                    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-surface border-t border-border">
                    <div className="flex gap-2 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "Listening..." : "Ask about your emails..."}
                            className={cn(
                                "flex-1 bg-background border border-border rounded-lg pl-4 pr-20 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner",
                                isListening && "border-green-500/50 ring-green-500/20 animate-pulse bg-green-500/5"
                            )}
                        />
                        <div className="absolute right-1.5 top-1.5 flex gap-1">
                            <button
                                onClick={toggleListening}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    isListening
                                        ? "bg-green-500 text-white animate-pulse"
                                        : "hover:bg-surface-highlight text-text-secondary hover:text-primary"
                                )}
                                title="Voice Command"
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="p-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
