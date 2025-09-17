@@ .. @@
   const signIn = async (email: string, password: string) => {
     try {
      // Add connection check before attempting sign up
      const { data: healthCheck } = await supabase.from('profiles').select('count').limit(1);
      
+      // Add connection check before attempting sign in
+      const { data: healthCheck } = await supabase.from('profiles').select('count').limit(1);
+      
       const { error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
       
       if (error) {
        // Handle specific connection errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Unable to connect to authentication service. Please check your internet connection and try again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message,
          });
        }
+        // Handle specific connection errors
+        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
+          toast({
+            variant: "destructive",
+            title: "Connection Error",
+            description: "Unable to connect to authentication service. Please check your internet connection and try again.",
+          });
+        } else {
+          toast({
+            variant: "destructive",
+            title: "Sign In Failed",
+            description: error.message,
+          });
+        }
-        toast({
-          variant: "destructive",
-          description: error.message,
-        });
       } else {
         toast({
           title: "Welcome back!",
           description: "You've successfully signed in.",
         });
       }
       
       return { error };
     } catch (error: any) {
      // Handle network and connection errors
      if (error.message?.includes('Failed to fetch') || error.name === 'NetworkError') {
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign Up Error",
          description: "An unexpected error occurred.",
        });
      }
+      // Handle network and connection errors
+      if (error.message?.includes('Failed to fetch') || error.name === 'NetworkError') {
+        toast({
+          variant: "destructive",
+          title: "Connection Error",
+          description: "Unable to connect to the server. Please check your internet connection.",
+        });
+      } else {
+        toast({
+          variant: "destructive",
+          title: "Sign In Error",
+          description: "An unexpected error occurred.",
+        });
+      }
-      toast({
-        variant: "destructive",
-        description: "An unexpected error occurred.",
-      });
       return { error };
     }
   };