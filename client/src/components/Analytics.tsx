import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Target, TrendingUp, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Session } from '@/types';
import { format, isToday, isThisWeek, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export default function Analytics() {
  const [sessions] = useLocalStorage<Session[]>('pomotron-sessions', []);

  const analytics = useMemo(() => {
    const completedSessions = sessions.filter(s => s.completed);
    const totalSessions = sessions.length;
    const successRate = totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0;
    const totalFocusTime = completedSessions
      .filter(s => s.sessionType === 'focus')
      .reduce((acc, s) => acc + s.duration, 0);

    // Calculate current streak
    const sessionDates = completedSessions
      .map(s => format(new Date(s.startTime), 'yyyy-MM-dd'))
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort()
      .reverse();

    let currentStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (sessionDates.includes(today)) {
      currentStreak = 1;
      for (let i = 1; i < sessionDates.length; i++) {
        const prevDate = new Date(sessionDates[i - 1]);
        const currentDate = new Date(sessionDates[i]);
        const dayDiff = Math.abs(prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Weekly data
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weeklyData = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = completedSessions.filter(s => 
        format(new Date(s.startTime), 'yyyy-MM-dd') === dayStr
      );
      
      return {
        date: format(day, 'EEE'),
        sessions: daySessions.length,
        focusTime: daySessions
          .filter(s => s.sessionType === 'focus')
          .reduce((acc, s) => acc + s.duration, 0) / 60, // Convert to minutes
      };
    });

    return {
      totalSessions: completedSessions.length,
      successRate,
      totalFocusTime: Math.round(totalFocusTime / 3600), // Convert to hours
      currentStreak,
      weeklyData,
    };
  }, [sessions]);

  const recentIntentions = useMemo(() => {
    return sessions
      .filter(s => s.task.trim() !== '')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
  }, [sessions]);

  const exportData = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pomotron-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all session data? This action cannot be undone.')) {
      localStorage.removeItem('pomotron-sessions');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-orbitron font-bold text-primary mb-2">Analytics Dashboard</h1>
        <p className="text-secondary/80">Track your productivity journey and celebrate your progress</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="neon-border glass-morphism text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">{analytics.totalSessions}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        
        <Card className="neon-border glass-morphism text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-secondary mb-2">{analytics.successRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>
        
        <Card className="neon-border glass-morphism text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-accent mb-2">{analytics.totalFocusTime}h</div>
            <div className="text-sm text-muted-foreground">Total Focus Time</div>
          </CardContent>
        </Card>
        
        <Card className="neon-border glass-morphism text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">{analytics.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weekly Chart */}
        <div className="lg:col-span-2">
          <Card className="neon-border glass-morphism">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-secondary">Weekly Progress</CardTitle>
                <div className="flex space-x-2">
                  <Badge variant="default" className="text-xs">Sessions</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(45, 45, 68, 0.9)',
                      border: '1px solid rgba(255, 107, 157, 0.5)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar 
                    dataKey="sessions" 
                    fill="url(#gradient)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--neon-pink)" />
                      <stop offset="100%" stopColor="var(--synthwave-purple)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Intentions */}
        <Card className="neon-border glass-morphism">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-secondary">Recent Intentions</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-primary">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {recentIntentions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No intentions recorded yet</p>
                    <p className="text-xs">Start a focus session to see your intentions here</p>
                  </div>
                ) : (
                  recentIntentions.map((session, index) => (
                    <div 
                      key={session.id} 
                      className={`border-l-2 pl-4 pb-4 ${
                        index % 4 === 0 ? 'border-primary/50' :
                        index % 4 === 1 ? 'border-secondary/50' :
                        index % 4 === 2 ? 'border-accent/50' :
                        'border-green-400/50'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground mb-1">
                        📌 {session.task}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        💭 {session.why}
                      </div>
                      <div className="text-xs text-secondary flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {isToday(new Date(session.startTime)) 
                          ? `Today, ${format(new Date(session.startTime), 'h:mm a')}`
                          : format(new Date(session.startTime), 'MMM d, h:mm a')
                        }
                        {session.completed && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={exportData}
          className="btn-secondary px-6 py-3"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
        <Button
          onClick={clearAllData}
          className="btn-danger px-6 py-3"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Data
        </Button>
      </div>
    </div>
  );
}
