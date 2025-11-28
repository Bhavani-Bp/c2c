"use client";

import React from "react";

export default class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, info: any) {
        console.error("React Error Boundary:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return <div>Something went wrong, but live chat is still connected.</div>;
        }

        return this.props.children;
    }
}
