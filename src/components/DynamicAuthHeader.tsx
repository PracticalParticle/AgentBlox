import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DynamicWidget, useDynamicContext, useProjectSettings } from '@dynamic-labs/sdk-react-core';
import { isDynamicEnvironmentConfigured } from '../lib/dynamic-config';

function DynamicAuthWidget() {
  const { sdkHasLoaded, refetchProjectSettings, primaryWallet } = useDynamicContext();
  const projectSettings = useProjectSettings();
  const [settingsError, setSettingsError] = useState(false);

  useEffect(() => {
    if (projectSettings) {
      setSettingsError(false);
      return;
    }

    if (!sdkHasLoaded) return;

    const timer = window.setTimeout(() => {
      if (!projectSettings) {
        setSettingsError(true);
      }
    }, 8_000);

    return () => window.clearTimeout(timer);
  }, [projectSettings, sdkHasLoaded]);

  useEffect(() => {
    if (!sdkHasLoaded || projectSettings) return;
    void refetchProjectSettings().catch(() => setSettingsError(true));
  }, [sdkHasLoaded, projectSettings, refetchProjectSettings]);

  return (
    <div className="dynamic-auth-header">
      {!projectSettings && !primaryWallet ? (
        <p className="dynamic-auth-status" aria-live="polite">
          {settingsError ? (
            <>
              Dynamic login unavailable — check{' '}
              <Link to="/setup">Setup</Link> (CORS + env id).
            </>
          ) : (
            'Loading Dynamic…'
          )}
        </p>
      ) : null}
      <DynamicWidget variant="modal" buttonClassName="dynamic-connect-btn" />
    </div>
  );
}

export default function DynamicAuthHeader() {
  if (!isDynamicEnvironmentConfigured()) {
    return (
      <Link to="/setup" className="dynamic-auth-fallback">
        Connect Dynamic (Owner)
      </Link>
    );
  }

  return <DynamicAuthWidget />;
}
