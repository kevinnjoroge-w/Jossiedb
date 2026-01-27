import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-6 custom-scrollbar overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
