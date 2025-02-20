import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Bot, Plus } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [analyzeText, setAnalyzeText] = useState("");

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      completed: false,
    },
  });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTask = useMutation({
    mutationFn: async (data: { title: string; completed: boolean }) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Task>;
    }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const getSuggestions = useMutation({
    mutationFn: async (task: string) => {
      const res = await apiRequest("POST", "/api/suggestions", { task });
      const data = await res.json();
      return data.suggestions as string[];
    },
    onSuccess: (suggestions) => {
      if (suggestions.length === 0) {
        toast({
          title: "No suggestions available",
          description: "The AI service is currently unavailable. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      suggestions.forEach((suggestion) => {
        createTask.mutate({ title: suggestion, completed: false });
      });
    },
  });

  const pendingTasks = tasks?.filter(task => !task.completed) || [];
  const completedTasks = tasks?.filter(task => task.completed) || [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Your Tasks</h1>
        <p className="text-muted-foreground">
          {completedTasks.length} completed, {pendingTasks.length} pending
        </p>
      </div>

      <div className="space-y-8">
        {/* New Task Input */}
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => createTask.mutate(data))}
                className="flex gap-2"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Add a new task..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createTask.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-purple-500">Pending Tasks</h2>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      updateTask.mutate({
                        id: task.id,
                        data: { completed: !!checked },
                      })
                    }
                  />
                  <span>{task.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Created {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Tasks */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-purple-500">Completed Tasks</h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      updateTask.mutate({
                        id: task.id,
                        data: { completed: !!checked },
                      })
                    }
                  />
                  <span className="line-through text-muted-foreground">{task.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Created {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Assistant */}
        <Card className="bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-purple-500" />
              <h2 className="font-semibold">AI Assistant</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get task suggestions and analyze your tasks with AI
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a task to analyze..."
                value={analyzeText}
                onChange={(e) => setAnalyzeText(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!analyzeText) {
                    toast({
                      title: "Enter a task first",
                      description: "Please enter a task before requesting suggestions.",
                      variant: "destructive",
                    });
                    return;
                  }
                  getSuggestions.mutate(analyzeText);
                }}
                disabled={getSuggestions.isPending}
              >
                {getSuggestions.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}