import { useMemo, memo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Target, TrendingUp, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Session, Settings } from '@/types';
import { format, isToday, isThisWeek, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';

const Analytics = memo(() => {
  const [sessions] = useLocalStorage<Session[]>('pomotron-sessions', []);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [settings] = useLocalStorage<Settings>('pomotron-settings', { 
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    autoStart: false,
    softStart: false,
    idleTimeout: 5,
    theme: 'starcourt' as const,
    websiteBlockingEnabled: true,
    frictionOverride: false,
    blockedSites: [],
    showQuotes: false,
    soundsEnabled: false,
    motivationalQuotesEnabled: false,
  });

  // Optimize analytics calculation with better performance
  const analytics = useMemo(() => {
    // Early return for empty sessions to avoid unnecessary calculations
    if (!sessions.length) {
      return {
        totalSessions: 0,
        successRate: 0,
        totalFocusTime: 0,
        currentStreak: 0,
        weeklyData: [],
      };
    }

    const completedSessions = sessions.filter(s => s.completed);
    const totalSessions = sessions.length;
    const successRate = Math.round((completedSessions.length / totalSessions) * 100);
    
    // More efficient calculation using reduce for both filter and sum
    const totalFocusTime = sessions.reduce((acc, s) => {
      return s.sessionType === 'focus' && s.completed ? acc + s.duration : acc;
    }, 0);

    // Calculate current streak with optimized date processing
    const uniqueDates = new Set(
      sessions.map(s => format(new Date(s.startTime), 'yyyy-MM-dd'))
    );
    const sessionDates = Array.from(uniqueDates).sort().reverse();

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

    // Weekly data with more efficient processing (start from Monday)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Group sessions by date first to avoid repeated filtering
    const sessionsByDate = new Map<string, typeof sessions>();
    sessions.forEach(s => {
      const dayStr = format(new Date(s.startTime), 'yyyy-MM-dd');
      if (!sessionsByDate.has(dayStr)) {
        sessionsByDate.set(dayStr, []);
      }
      sessionsByDate.get(dayStr)!.push(s);
    });
    
    const weeklyData = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessionsByDate.get(dayStr) || [];
      
      const focusTime = daySessions.reduce((acc, s) => {
        return s.sessionType === 'focus' && s.completed ? acc + s.duration : acc;
      }, 0) / 60; // Convert to minutes
      
      return {
        date: format(day, 'EEE'),
        sessions: daySessions.length,
        focusTime,
      };
    });

    return {
      totalSessions,
      successRate,
      totalFocusTime: Math.round(totalFocusTime / 3600), // Convert to hours
      currentStreak,
    };
  }, [sessions]);

  // Separate calculation for weekly data that can handle historical weeks
  const weeklyAnalytics = useMemo(() => {
    // Calculate the target week based on offset
    const targetDate = selectedWeekOffset === 0 ? new Date() : addWeeks(new Date(), selectedWeekOffset);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Group sessions by date first to avoid repeated filtering
    const sessionsByDate = new Map<string, typeof sessions>();
    sessions.forEach(s => {
      const dayStr = format(new Date(s.startTime), 'yyyy-MM-dd');
      if (!sessionsByDate.has(dayStr)) {
        sessionsByDate.set(dayStr, []);
      }
      sessionsByDate.get(dayStr)!.push(s);
    });
    
    const weeklyData = weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessionsByDate.get(dayStr) || [];
      
      const focusTime = daySessions.reduce((acc, s) => {
        return s.sessionType === 'focus' && s.completed ? acc + s.duration : acc;
      }, 0) / 60; // Convert to minutes
      
      return {
        date: format(day, 'EEE'),
        sessions: daySessions.length,
        focusTime,
      };
    });

    // Get sessions for this specific week for the sessions list
    const weekSessions = sessions
      .filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Group weekly sessions by day
    const groupedByDay = weekSessions.reduce((acc, session) => {
      const dayKey = format(new Date(session.startTime), 'yyyy-MM-dd');
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    return {
      weeklyData,
      weekSessions: groupedByDay,
      weekStart,
      weekEnd,
    };
  }, [sessions, selectedWeekOffset]);

  // This is now handled by weeklyAnalytics.weekSessions

  const focusTimeByIntention = useMemo(() => {
    // Get all focus sessions from the selected week
    const targetDate = selectedWeekOffset === 0 ? new Date() : addWeeks(new Date(), selectedWeekOffset);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
    
    const weekFocusSessions = sessions
      .filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= weekStart && 
               sessionDate <= weekEnd && 
               s.sessionType === 'focus' && 
               s.completed;
      });

    // Group by intention and sum focus time based on completed sessions
    const intentionTimeMap = weekFocusSessions.reduce((acc, session) => {
      const intention = session.task?.trim() || 'Focus Session (No intention set)';
      // Use standard focus duration for completed sessions only
      const focusTimeMinutes = settings.focusDuration;
      
      if (!acc[intention]) {
        acc[intention] = {
          totalTime: 0,
          sessionCount: 0,
          sessions: []
        };
      }
      
      acc[intention].totalTime += focusTimeMinutes;
      acc[intention].sessionCount += 1;
      acc[intention].sessions.push(session);
      
      return acc;
    }, {} as Record<string, { totalTime: number; sessionCount: number; sessions: Session[] }>);

    // Sort by total time descending
    return Object.entries(intentionTimeMap)
      .sort(([, a], [, b]) => b.totalTime - a.totalTime);
  }, [sessions, settings.focusDuration, selectedWeekOffset]);

  const exportData = () => {
    // Import XLSX dynamically
    import('xlsx').then((XLSX) => {
      // Prepare data for Excel export
      const exportSessions = sessions.map(session => ({
        'Date': format(new Date(session.startTime), 'yyyy-MM-dd'),
        'Time': format(new Date(session.startTime), 'HH:mm:ss'),
        'Session Type': session.sessionType,
        'Duration (minutes)': Math.round(session.duration / 60),
        'Completed': session.completed ? 'Yes' : 'No',
        'Task': session.task || '',
        'Why Important': session.why || '',
        'Cycle': session.cycleNumber || 1
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportSessions);

      // Add some styling to headers
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FF6B9D" } }
        };
      }

      // Set column widths
      ws['!cols'] = [
        { width: 12 }, // Date
        { width: 10 }, // Time
        { width: 15 }, // Session Type
        { width: 18 }, // Duration
        { width: 12 }, // Completed
        { width: 30 }, // Task
        { width: 30 }, // Why Important
        { width: 8 }   // Cycle
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Pomotron Sessions');

      // Export file
      XLSX.writeFile(wb, `pomotron-data-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }).catch((error) => {
      console.error('Failed to export Excel file:', error);
      // Fallback to JSON export
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
    });
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all session data? This action cannot be undone.')) {
      localStorage.removeItem('pomotron-sessions');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-orbitron font-black text-primary mb-2 neon-text tracking-wider">
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            ANALYTICS DASHBOARD
          </span>
        </h1>
        <p className="text-secondary font-tech-mono">Track your productivity journey and celebrate your progress</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sessions */}
        <Card className="neon-border glass-morphism text-center relative overflow-hidden group hover:scale-105 analytics-card-hover scanlines">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="mb-3 relative">
              <Calendar className="h-8 w-8 mx-auto text-primary drop-shadow-neon retro-pulse" />
              <div className="absolute -inset-2 bg-primary/10 rounded-full blur-md group-hover:bg-primary/20 transition-all duration-300" />
            </div>
            <div className="text-4xl font-orbitron font-black text-primary mb-2">
              {analytics.totalSessions}
            </div>
            <div className="text-xs text-primary/80 font-tech-mono uppercase tracking-wider">
              Total Sessions
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping" />
          </CardContent>
        </Card>
        
        {/* Success Rate */}
        <Card className="neon-border glass-morphism text-center relative overflow-hidden group hover:scale-105 analytics-card-hover scanlines">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-secondary/5 group-hover:from-secondary/20 group-hover:to-secondary/10 transition-all duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="mb-3 relative">
              <Target className="h-8 w-8 mx-auto text-secondary drop-shadow-neon retro-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -inset-2 bg-secondary/10 rounded-full blur-md group-hover:bg-secondary/20 transition-all duration-300" />
            </div>
            <div className="text-4xl font-orbitron font-black text-secondary mb-2">
              {analytics.successRate}%
            </div>
            <div className="text-xs text-secondary/80 font-tech-mono uppercase tracking-wider">
              Success Rate
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          </CardContent>
        </Card>
        
        {/* Total Focus Time */}
        <Card className="neon-border glass-morphism text-center relative overflow-hidden group hover:scale-105 analytics-card-hover scanlines">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 group-hover:from-accent/20 group-hover:to-accent/10 transition-all duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="mb-3 relative">
              <Clock className="h-8 w-8 mx-auto text-accent drop-shadow-neon retro-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute -inset-2 bg-accent/10 rounded-full blur-md group-hover:bg-accent/20 transition-all duration-300" />
            </div>
            <div className="text-4xl font-orbitron font-black text-accent mb-2">
              {analytics.totalFocusTime}h
            </div>
            <div className="text-xs text-accent/80 font-tech-mono uppercase tracking-wider">
              Focus Hours
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          </CardContent>
        </Card>
        
        {/* Day Streak */}
        <Card className="neon-border glass-morphism text-center relative overflow-hidden group hover:scale-105 analytics-card-hover scanlines">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-emerald-400/5 group-hover:from-green-400/20 group-hover:to-emerald-400/10 transition-all duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className="mb-3 relative">
              <TrendingUp className="h-8 w-8 mx-auto text-green-400 drop-shadow-neon retro-pulse" style={{ animationDelay: '1.5s' }} />
              <div className="absolute -inset-2 bg-green-400/10 rounded-full blur-md group-hover:bg-green-400/20 transition-all duration-300" />
            </div>
            <div className="text-4xl font-orbitron font-black text-green-400 mb-2">
              {analytics.currentStreak}
            </div>
            <div className="text-xs text-green-400/80 font-tech-mono uppercase tracking-wider">
              Day Streak
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Weekly Chart */}
        <div className="lg:col-span-2">
          <Card className="neon-border glass-morphism">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="section-title text-lg text-secondary">Weekly Progress</CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                      className="h-8 w-8 p-0 neon-border-sm glass-morphism hover:bg-accent/10"
                    >
                      <ChevronLeft className="h-4 w-4 text-accent" />
                    </Button>
                    <span className="text-sm font-tech-mono text-accent/80 min-w-[120px] sm:min-w-[140px] text-center">
                      {selectedWeekOffset === 0 
                        ? 'This Week' 
                        : `${Math.abs(selectedWeekOffset)} week${Math.abs(selectedWeekOffset) > 1 ? 's' : ''} ago`
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                      disabled={selectedWeekOffset >= 0}
                      className="h-8 w-8 p-0 neon-border-sm glass-morphism hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4 text-accent" />
                    </Button>
                  </div>
                  <Badge variant="default" className="text-xs font-tech-mono">Sessions</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyAnalytics.weeklyData}>
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

        {/* Weekly Sessions */}
        <Card className="neon-border glass-morphism">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="section-title text-lg text-secondary flex items-center space-x-2">
                <Target className="h-5 w-5 text-secondary" />
                <span>Weekly Sessions</span>
              </CardTitle>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                  className="h-8 w-8 p-0 neon-border-sm glass-morphism hover:bg-secondary/10"
                >
                  <ChevronLeft className="h-4 w-4 text-secondary" />
                </Button>
                <span className="text-xs sm:text-sm font-tech-mono text-secondary/80 min-w-[80px] sm:min-w-[100px] text-center">
                  {format(weeklyAnalytics.weekStart, 'MMM d')} - {format(weeklyAnalytics.weekEnd, 'MMM d')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                  disabled={selectedWeekOffset >= 0}
                  className="h-8 w-8 p-0 neon-border-sm glass-morphism hover:bg-secondary/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4 text-secondary" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 px-6 py-4">
              <div className="space-y-6">
                {Object.keys(weeklyAnalytics.weekSessions).length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sessions recorded this week</p>
                    <p className="text-xs">Start your first focus session to see your activity here</p>
                  </div>
                ) : (
                  Object.entries(weeklyAnalytics.weekSessions)
                    .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
                    .map(([dateKey, daySessions]: [string, Session[]]) => {
                      const date = new Date(dateKey);
                      const dayLabel = isToday(date) 
                        ? 'Today' 
                        : format(date, 'EEEE, MMM d');
                      
                      return (
                        <div key={dateKey} className="space-y-4">
                          <div className="mb-4 pb-3 border-b border-accent/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-orbitron font-bold text-accent drop-shadow-neon">
                                  {dayLabel}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                  <span className="text-sm font-tech-mono text-accent/70 tracking-wider">
                                    {daySessions.length} SESSION{daySessions.length !== 1 ? 'S' : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs font-tech-mono text-accent/50 tracking-widest">
                                {format(date, 'MMM d')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {daySessions.map((session: Session, index: number) => {
                              // Calculate individual session duration (actual time spent)
                              const sessionDurationMinutes = Math.round(session.duration / 60);
                              const sessionHours = Math.floor(sessionDurationMinutes / 60);
                              const sessionMinutes = sessionDurationMinutes % 60;
                              const totalTimeString = sessionHours > 0 
                                ? `${sessionHours}h ${sessionMinutes}m` 
                                : `${sessionMinutes}m`;
                              
                              return (
                                <div 
                                  key={session.id} 
                                  className="bg-card/30 hover:bg-card/50 rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] relative overflow-hidden group"
                                >
                                  {/* Subtle left accent line */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent/60 via-accent/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                                  
                                  <div className="flex items-start justify-between mb-2 gap-2">
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                      <div className="text-sm font-medium text-foreground truncate mb-1">
                                        {session.task.trim() ? session.task : '⏱️ Focus Session (No intention set)'}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {session.why.trim() ? session.why : 'Started without setting specific goal'}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      <Badge 
                                        variant={session.completed ? "default" : "secondary"} 
                                        className="text-xs font-tech-mono whitespace-nowrap"
                                      >
                                        {totalTimeString}
                                      </Badge>
                                      {session.completed && (
                                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{format(new Date(session.startTime), 'h:mm a')}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={exportData}
              className="btn-secondary px-6 py-3"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
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
      </div>
    </div>
  );
});

Analytics.displayName = 'Analytics';

export default Analytics;
