import React, { useState } from "react";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";

function MainLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Estado para el sidebar

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Área de Contenido de la Página */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children} {/* Aquí se renderizará AdminPage o UserPage */}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
