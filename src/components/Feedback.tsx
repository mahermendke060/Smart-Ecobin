import { useState } from 'react';
import { Star, Send, MessageSquare, Lightbulb, Bug, Heart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type FeedbackType = 'general' | 'feature' | 'bug' | 'appreciation';

interface FeedbackCategory {
  id: FeedbackType;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const Feedback = () => {
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const feedbackCategories: FeedbackCategory[] = [
    {
      id: 'general',
      label: 'General Feedback',
      icon: MessageSquare,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      description: 'Share your overall experience with Smart EcoBin'
    },
    {
      id: 'feature',
      label: 'Feature Request',
      icon: Lightbulb,
      color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      description: 'Suggest new features or improvements'
    },
    {
      id: 'bug',
      label: 'Report Bug',
      icon: Bug,
      color: 'bg-red-500/10 text-red-600 border-red-200',
      description: 'Report issues or problems you encountered'
    },
    {
      id: 'appreciation',
      label: 'Appreciation',
      icon: Heart,
      color: 'bg-pink-500/10 text-pink-600 border-pink-200',
      description: 'Share what you love about the app'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide your feedback before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send feedback to backend API
      const feedbackData = {
        type: selectedType,
        rating: selectedType === 'general' || selectedType === 'appreciation' ? rating : null,
        message: feedback.trim(),
        email: email.trim() || user?.email,
      };

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token || !user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to submit feedback.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Submitting feedback with token:', token ? 'Token exists' : 'No token');
      console.log('User:', user);

      const response = await fetch('http://localhost:8000/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit feedback');
      }

      const result = await response.json();
      console.log('Feedback submitted successfully:', result);

      setIsSubmitted(true);
      toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for helping us improve Smart EcoBin.',
      });

      // Reset form after a delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFeedback('');
        setRating(0);
        setEmail('');
        setSelectedType('general');
      }, 3000);

    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          className="p-1 transition-colors"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hoveredRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating} out of 5 stars
        </span>
      )}
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/10 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted successfully. We appreciate your input and will use it to improve Smart EcoBin.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                💚 Your contribution helps us build a better waste management solution for everyone!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">We Value Your Feedback</h1>
        <p className="text-muted-foreground text-lg">
          Help us improve Smart EcoBin by sharing your thoughts, suggestions, or reporting issues.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Feedback Type Selection */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Feedback Type</h2>
          <div className="space-y-3">
            {feedbackCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedType(category.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedType === category.id
                      ? `${category.color} border-current`
                      : 'border-border hover:border-muted-foreground/50 bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">{category.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const selectedCategory = feedbackCategories.find(cat => cat.id === selectedType);
                  const Icon = selectedCategory?.icon || MessageSquare;
                  return <Icon className="h-5 w-5" />;
                })()}
                {feedbackCategories.find(cat => cat.id === selectedType)?.label}
              </CardTitle>
              <CardDescription>
                {feedbackCategories.find(cat => cat.id === selectedType)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating for general feedback and appreciation */}
                {(selectedType === 'general' || selectedType === 'appreciation') && (
                  <div className="space-y-2">
                    <Label>How would you rate your experience?</Label>
                    {renderStarRating()}
                  </div>
                )}

                {/* Feedback Text */}
                <div className="space-y-2">
                  <Label htmlFor="feedback">
                    {selectedType === 'bug' ? 'Describe the issue' :
                     selectedType === 'feature' ? 'Describe your feature request' :
                     selectedType === 'appreciation' ? 'What do you love about Smart EcoBin?' :
                     'Share your feedback'}
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder={
                      selectedType === 'bug' ? 'Please describe the bug you encountered, including steps to reproduce it...' :
                      selectedType === 'feature' ? 'Describe the feature you would like to see added...' :
                      selectedType === 'appreciation' ? 'Tell us what you enjoy most about using Smart EcoBin...' :
                      'Share your thoughts about Smart EcoBin...'
                    }
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {/* Email (optional if user is not logged in) */}
                {!user?.email && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide your email if you'd like us to follow up on your feedback.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedType === 'bug' ? '🐛 Bug Report' :
                       selectedType === 'feature' ? '💡 Feature Request' :
                       selectedType === 'appreciation' ? '❤️ Appreciation' :
                       '💬 General Feedback'}
                    </Badge>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !feedback.trim()}
                    className="bg-eco hover:bg-eco/90"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">💡 Tips for better feedback:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Be specific about the issue or suggestion</li>
              <li>• Include steps to reproduce bugs when possible</li>
              <li>• Mention your device type and browser if reporting technical issues</li>
              <li>• Feel free to suggest improvements to existing features</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
