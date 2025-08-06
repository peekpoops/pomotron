import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface IntentionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (intention?: { task: string; why: string }) => void;
}

export default function IntentionModal({ open, onOpenChange, onSubmit }: IntentionModalProps) {
  const [task, setTask] = useState('');
  const [why, setWhy] = useState('');

  const handleSubmit = () => {
    onSubmit({ task: task.trim(), why: why.trim() });
    setTask('');
    setWhy('');
  };

  const handleSkip = () => {
    onSubmit();
    setTask('');
    setWhy('');
  };

  const handleClose = () => {
    setTask('');
    setWhy('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="neon-border glass-morphism max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-orbitron font-bold text-primary text-center">
            Set Your Intention
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Take a moment to clarify your focus for this session
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="task" className="text-sm font-medium text-muted-foreground">
              What are you working on today?
            </Label>
            <Input
              id="task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., Finish project proposal"
              className="form-input"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="why" className="text-sm font-medium text-muted-foreground">
              Why is this important to you?
            </Label>
            <Textarea
              id="why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="e.g., It will help advance my career"
              className="form-input resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Button
            variant="secondary"
            onClick={handleSkip}
            className="btn-secondary flex-1 py-3"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            className="btn-primary flex-1 py-3"
          >
            Start Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
