type ProBadgeProps = {
    className?: string;
  };
  
  export function ProBadge({ className = "" }: ProBadgeProps) {
    return (
      <div
        className={`flex items-center justify-center
          w-16 h-16
          rounded-xl
          border-2 border-white
          bg-transparent
          ${className}`}
      >
        <span className="text-[#E6C9A8] font-bold text-lg tracking-wide">
          PRO
        </span>
      </div>
    );
  }