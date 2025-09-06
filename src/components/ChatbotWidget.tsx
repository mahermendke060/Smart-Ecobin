import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m EcoBot, your eco-friendly assistant. How can I help you with waste disposal today?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('plastic') || input.includes('bottle')) {
      return 'Great question! Plastic bottles should go in the recycling bin. Make sure to remove the cap and rinse the bottle first. You\'ll earn 5 eco-points for each bottle!';
    }
    
    if (input.includes('paper') || input.includes('cardboard')) {
      return 'Paper and cardboard go in the recycling bin too! Make sure they\'re clean and dry. Wet paper should go in compost if it\'s unbleached.';
    }
    
    if (input.includes('organic') || input.includes('food') || input.includes('compost')) {
      return 'Food scraps and organic waste go in the compost bin. This helps create nutrient-rich soil and reduces methane emissions!';
    }
    
    if (input.includes('battery') || input.includes('electronic')) {
      return 'Batteries and electronics need special disposal! Use our Bin Locator to find the nearest e-waste collection point. Never put these in regular trash!';
    }
    
    if (input.includes('points') || input.includes('reward')) {
      return 'You earn eco-points for proper waste disposal! Plastic bottles: 5 points, Paper: 3 points, Organic waste: 4 points. Check your Analytics page for more details!';
    }
    
    return 'I can help you with waste sorting, finding disposal locations, and explaining our rewards system. Try asking about specific materials like plastic, paper, or organic waste!';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-80 h-96 z-50 shadow-eco border-eco-light/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-eco/5">
            <CardTitle className="text-sm font-medium text-eco">EcoBot Assistant</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-full">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.isBot
                          ? 'bg-eco/10 text-eco-dark border border-eco-light/30'
                          : 'bg-eco text-white'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-eco-light/30">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about waste disposal..."
                  className="flex-1 border-eco-light/50 focus:border-eco"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="bg-eco hover:bg-eco-dark"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-eco hover:bg-eco-dark shadow-eco z-50"
        size="sm"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </>
  );
};

export default ChatbotWidget;