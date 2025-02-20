import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, ListChecks } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { loginMutation, registerMutation, user } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: InsertUser) => {
    if (isLogin) {
      loginMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Form Side */}
        <Card className="w-full border-2 border-purple-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-purple-600">
              {isLogin
                ? "Sign in to manage your tasks"
                : "Sign up to start managing your tasks"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-2 border-purple-100 focus:border-purple-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          className="border-2 border-purple-100 focus:border-purple-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLogin ? (
                      "Sign In"
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin
                      ? "Don't have an account? Sign Up"
                      : "Already have an account? Sign In"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Hero Side */}
        <div className="hidden md:block text-center">
          <div className="mb-6">
            <ListChecks className="h-16 w-16 text-purple-500 mx-auto" />
            <h2 className="text-3xl font-bold text-purple-800 mt-4">
              Task Manager
            </h2>
          </div>
          <p className="text-purple-600 text-lg leading-relaxed">
            A beautiful and intelligent task management system with AI-powered
            suggestions to help you stay organized and productive.
          </p>
        </div>
      </div>
    </div>
  );
}