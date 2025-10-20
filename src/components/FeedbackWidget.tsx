import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, X, Send, Star } from 'lucide-react';

interface FeedbackWidgetProps {
  userType: 'admin' | 'customer';
}

export function FeedbackWidget({ userType }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'improvement',
    message: '',
    rating: 0
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.message.trim()) {
      alert('Please enter your feedback');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('user_feedback').insert([{
      user_id: user?.id,
      user_type: userType,
      feedback_type: feedback.type,
      page_url: window.location.pathname,
      message: feedback.message,
      rating: feedback.rating,
      status: 'new'
    }]);

    if (error) {
      alert('Failed to submit feedback. Please try again.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setFeedback({ type: 'improvement', message: '', rating: 0 });
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#bb2738] text-white rounded-full shadow-lg hover:bg-[#a01f2f] transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">Feedback</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Thank You!</h3>
                <p className="text-slate-600">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">Send Feedback</h3>
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Feedback Type</label>
                    <select
                      value={feedback.type}
                      onChange={(e) => setFeedback({ ...feedback, type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                    >
                      <option value="bug">Bug Report</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="improvement">Improvement</option>
                      <option value="praise">Praise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Feedback</label>
                    <textarea
                      value={feedback.message}
                      onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                      placeholder="Tell us what's on your mind..."
                      rows={5}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rating (Optional)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFeedback({ ...feedback, rating: star })}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
