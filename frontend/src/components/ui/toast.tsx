interface ToastProps {
  message: string;
  color: string; 
}

export const Toast = ({ message, color }: ToastProps) => {
  const colorMap: Record<typeof color, string> = {
    green: "bg-green-700",
    red: "bg-red-700",
    yellow: "bg-yellow-500",
    blue: "bg-blue-700",
  };

  const bgClass = colorMap[color] || "bg-black"; 

  return (
    <div
      className={`${bgClass} fixed bottom-6 right-6 text-white px-4 py-2 rounded shadow-lg`}
    >
      {message}
    </div>
  );
};