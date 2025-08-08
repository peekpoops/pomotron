import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, MessageSquare } from "lucide-react";
import type { Feedback } from "@shared/schema";

export default function FeedbackAdmin() {
  const { data: feedback = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading feedback...</div>
      </div>
    );
  }

  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : "0";

  const ratingCounts = feedback.reduce((acc, f) => {
    acc[f.rating] = (acc[f.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Pomotron Feedback Dashboard</h1>
        <p className="text-muted-foreground">
          {feedback.length} total feedback submissions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{feedback.length}</div>
            <div className="text-sm text-muted-foreground">Total Feedback</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold flex items-center justify-center">
              {averageRating} <Star className="h-5 w-5 text-yellow-400 ml-1" />
            </div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.comment && f.comment.trim().length > 0).length}
            </div>
            <div className="text-sm text-muted-foreground">With Comments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.rating >= 4).length}
            </div>
            <div className="text-sm text-muted-foreground">4+ Stars</div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: feedback.length > 0 
                        ? `${((ratingCounts[rating] || 0) / feedback.length) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">
                  {ratingCounts[rating] || 0}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            All Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback submissions yet.
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <span>{item.rating}</span>
                        <Star className="h-3 w-3 text-yellow-400" />
                      </Badge>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  {item.comment && item.comment.trim() && (
                    <div className="text-sm bg-gray-50 dark:bg-gray-800 rounded p-3">
                      <p className="whitespace-pre-wrap">{item.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}