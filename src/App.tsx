import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Landing } from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DebugRoute from "./pages/DebugRoute";
import { PaymentSuccessPage } from "./pages/PaymentSuccess";
import Confirm from "./pages/Confirm";
import Subscribe from "./pages/Subscribe";
import Return from "./pages/Return";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { SuperAdminProvider } from "./contexts/SuperAdminContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SubscriptionProvider>
      <SuperAdminProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/debug" element={<DebugRoute />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/confirm" element={<Confirm />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/return" element={<Return />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/app" element={<Index />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </SuperAdminProvider>
    </SubscriptionProvider>
  </QueryClientProvider>
);

export default App;