// Website blocking functionality using service worker
let isBlocking = false;
let blockedSites: string[] = [];

export function activateWebsiteBlocking(sites: string[]): void {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported - website blocking unavailable');
    return;
  }
  
  isBlocking = true;
  blockedSites = sites;
  
  // Send message to service worker to activate blocking
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active) {
      registration.active.postMessage({
        type: 'ACTIVATE_BLOCKING',
        sites: sites
      });
    }
  });
  
  console.log('Website blocking activated for:', sites);
}

export function deactivateWebsiteBlocking(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  
  isBlocking = false;
  blockedSites = [];
  
  // Send message to service worker to deactivate blocking
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active) {
      registration.active.postMessage({
        type: 'DEACTIVATE_BLOCKING'
      });
    }
  });
  
  console.log('Website blocking deactivated');
}

export function isCurrentlyBlocking(): boolean {
  return isBlocking;
}

export function getBlockedSites(): string[] {
  return [...blockedSites];
}

export function addBlockedSite(site: string): void {
  const normalizedSite = site.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (!blockedSites.includes(normalizedSite)) {
    blockedSites.push(normalizedSite);
    
    if (isBlocking) {
      activateWebsiteBlocking(blockedSites);
    }
  }
}

export function removeBlockedSite(site: string): void {
  const normalizedSite = site.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  blockedSites = blockedSites.filter(s => s !== normalizedSite);
  
  if (isBlocking) {
    activateWebsiteBlocking(blockedSites);
  }
}

// Handle override with friction
export function requestOverride(site: string, frictionEnabled: boolean = false): Promise<boolean> {
  return new Promise((resolve) => {
    if (!frictionEnabled) {
      resolve(false);
      return;
    }
    
    // Simple friction mechanism - require multiple confirmations
    const confirmMessage = `You're trying to access ${site} during a focus session. Are you sure you want to break your focus?`;
    
    if (confirm(confirmMessage)) {
      const secondConfirm = confirm('This will end your current focus session. Are you absolutely sure?');
      if (secondConfirm) {
        // Add 5-second delay as additional friction
        setTimeout(() => {
          resolve(confirm('Last chance to stay focused. Really proceed?'));
        }, 5000);
      } else {
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}
