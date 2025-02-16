import * as React from 'react';
import Dialog from '@mui/material/Dialog';

export interface CustomDialogProps {
    open: boolean;
    onClose?: () => void;
    children: React.ReactNode;
  }
  
function CustomDialog({ onClose, open, children }: CustomDialogProps) {  
  return (
    <Dialog onClose={onClose} open={open}>
      {children}
    </Dialog>
  );
}

export default CustomDialog;