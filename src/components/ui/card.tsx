export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
);