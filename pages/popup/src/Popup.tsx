import '@src/Popup.css';
import SaveToFeishu from './SaveToFeishu';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

const Popup = () => <SaveToFeishu />;

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
