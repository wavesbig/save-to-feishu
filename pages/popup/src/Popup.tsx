import '@src/Popup.css';
import SaveToFeishu from './SaveToFeishu';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, Toaster, useSonnerToast } from '@extension/ui';

const Popup = () => {
  // 启用sonner toast消息监听
  useSonnerToast();

  return (
    <div className="App">
      <Toaster />
      <SaveToFeishu />
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
