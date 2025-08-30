import '@src/Popup.css';
import SaveToFeishu from './SaveToFeishu';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { setupUIEventRouter } from '@extension/shared/lib/message/message';
import { ErrorDisplay, LoadingSpinner, Toaster, useSonnerToast } from '@extension/ui';
import { useEffect } from 'react';

const Popup = () => {
  // 启用sonner toast消息监听
  useSonnerToast();

  useEffect(() => {
    setupUIEventRouter();
  }, []);

  return (
    <div className="App">
      <Toaster />
      <SaveToFeishu />
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
