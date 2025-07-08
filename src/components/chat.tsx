"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chat, ChatInput } from '@/ai/flows/chat-flow';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'model';
    content: string;
};

export function LiveChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Hello! How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newUserMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chatInput: ChatInput = {
                history: messages,
                message: input,
            };
            const result = await chat(chatInput);
            const newModelMessage: Message = { role: 'model', content: result.response };
            setMessages(prev => [...prev, newModelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button
                    variant="primary"
                    size="icon"
                    className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
                >
                    <MessageSquare className="h-6 w-6" />
                    <span className="sr-only">Open Live Chat</span>
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-md h-[70vh] flex flex-col">
                    <div className="flex-1 bg-muted/50 rounded-t-lg p-4 flex flex-col">
                        <h3 className="text-lg font-medium text-center pb-2">Admin Support</h3>
                        <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <div className="space-y-4 p-4">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex items-end gap-2",
                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                        )}
                                    >
                                        {message.role === 'model' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-xs rounded-lg px-4 py-2 text-sm",
                                                message.role === 'user'
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-background"
                                            )}
                                        >
                                            <p>{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                     <div className="flex items-end gap-2 justify-start">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                                        </Avatar>
                                        <div className="max-w-xs rounded-lg px-4 py-2 text-sm bg-background">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="mt-4 flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                placeholder="Type your message..."
                                disabled={isLoading}
                            />
                            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
