import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-strong max-w-md w-full p-8 rounded-3xl text-center shadow-2xl space-y-6"
                    >
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto ring-8 ring-destructive/5">
                            <AlertTriangle size={40} className="text-destructive" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                            <p className="text-muted-foreground text-sm">
                                The application encountered an unexpected error. Don't worry, your data is safe.
                            </p>
                        </div>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="p-4 bg-muted/50 rounded-xl text-left overflow-auto max-h-40 border border-border">
                                <code className="text-xs text-destructive font-mono">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button
                                onClick={this.handleReset}
                                className="btn-primary flex items-center justify-center gap-2 group"
                            >
                                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                Retry
                            </button>
                            <Link
                                to="/"
                                onClick={() => this.setState({ hasError: false })}
                                className="btn-secondary flex items-center justify-center gap-2"
                            >
                                <Home size={18} />
                                Go Home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
