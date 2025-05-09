import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode; // Defines the type for children
  className?: string;  // Optional className prop
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-4 ${className || ""}`}>
      {children}
    </div>
  );
};

export default Card;