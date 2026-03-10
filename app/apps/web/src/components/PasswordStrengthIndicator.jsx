import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  let label = 'Weak';
  let color = 'bg-destructive';
  let width = 'w-1/3';

  if (strength >= 4) {
    label = 'Strong';
    color = 'bg-green-500';
    width = 'w-full';
  } else if (strength >= 2) {
    label = 'Fair';
    color = 'bg-yellow-500';
    width = 'w-2/3';
  }

  if (!password) {
    label = '';
    color = 'bg-muted';
    width = 'w-0';
  }

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">Password strength</span>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} ${width} transition-all duration-300`} />
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;