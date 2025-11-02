import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  Flex,
  useToast,
  Avatar,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { ArrowUpIcon, CheckIcon, WarningIcon } from '@chakra-ui/icons';

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
}

interface ChatSession {
  id: number;
  resume_id: number;
  created_at: string;
  last_message_at: string;
  is_active: boolean;
  messages: Message[];
}

interface ChatProps {
  resumeId: number;
}

export const Chat: React.FC<ChatProps> = ({ resumeId }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadSessions();
  }, [resumeId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/chat/sessions/${resumeId}`);
      if (!response.ok) throw new Error('Failed to load chat sessions');
      
      const data = await response.json();
      setSessions(data);
      
      // Set current session to the most recent active session
      const activeSession = data.find((s: ChatSession) => s.is_active);
      if (activeSession) {
        setCurrentSession(activeSession);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error loading chat sessions',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/chat/sessions/${resumeId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create chat session');
      
      const newSession = await response.json();
      setSessions([...sessions, newSession]);
      setCurrentSession(newSession);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error creating chat session',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSession) return;

    const msgContent = message;
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/chat/sessions/${currentSession.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: msgContent,
            role: 'user',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      const newMessage = await response.json();
      setCurrentSession({
        ...currentSession,
        messages: [...currentSession.messages, newMessage],
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error sending message',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!currentSession) {
    return (
      <Flex direction="column" align="center" justify="center" h="full" p={4}>
        <Text mb={4}>No active chat session</Text>
        <Button onClick={createNewSession} colorScheme="blue">
          Start New Chat
        </Button>
      </Flex>
    );
  }

  return (
    <Box h="full" display="flex" flexDirection="column">
      {/* Messages area */}
      <VStack
        flex="1"
        overflowY="auto"
        spacing={4}
        p={4}
        alignItems="stretch"
      >
        {currentSession.messages.map((msg) => (
          <Flex
            key={msg.id}
            justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            align="start"
            gap={2}
          >
            {msg.role !== 'user' && (
              <Avatar
                size="sm"
                name={msg.role === 'assistant' ? 'AI Assistant' : 'System'}
                bg={msg.role === 'assistant' ? 'blue.500' : 'gray.500'}
              />
            )}
            <Box
              maxW="80%"
              bg={msg.role === 'user' ? 'blue.500' : 'gray.700'}
              color="white"
              px={4}
              py={2}
              borderRadius="lg"
            >
              <Text>{msg.content}</Text>
            </Box>
            {msg.role === 'user' && (
              <Avatar size="sm" name="User" bg="green.500" />
            )}
          </Flex>
        ))}
        <div ref={messagesEndRef} />
      </VStack>

      {/* Input area */}
      <Box p={4} borderTop="1px" borderColor="gray.700">
        <Flex gap={2}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading || !currentSession.is_active}
          />
          <IconButton
            aria-label="Send message"
            icon={loading ? <Spinner /> : <ArrowUpIcon />}
            onClick={sendMessage}
            disabled={loading || !message.trim() || !currentSession.is_active}
            colorScheme="blue"
          />
        </Flex>
      </Box>
    </Box>
  );
};