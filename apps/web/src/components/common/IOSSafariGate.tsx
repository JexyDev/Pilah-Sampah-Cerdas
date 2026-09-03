/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * iOS Safari Gate Component (Passthrough mode for universal mobile & web support)
 */

import React from 'react';

interface IOSSafariGateProps {
  children: React.ReactNode;
}

export const IOSSafariGate: React.FC<IOSSafariGateProps> = ({ children }) => {
  return <>{children}</>;
};

export default IOSSafariGate;
