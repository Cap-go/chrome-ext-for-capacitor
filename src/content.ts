// content.ts

import { Capacitor } from '@capacitor/core';
import { DeviceConfig } from './deviceConfigs';

declare global {
  interface Window {
    Capacitor: typeof Capacitor;
    checkSimulationStatus: () => { isActive: boolean; isCameraVisible: boolean; currentDeviceName: string };
    setSimulationStatus: (status: { isActive: boolean; isCameraVisible: boolean; currentDeviceName: string }) => void;
  }
}

const originalCapacitor = window.Capacitor;
const registeredPlugins: Record<string, any> = {};

function getOrRegisterPlugin(pluginName: string) {
  if (!registeredPlugins[pluginName]) {
    registeredPlugins[pluginName] = Capacitor.registerPlugin(pluginName);
  }
  return registeredPlugins[pluginName];
}

function platformFor(device: DeviceConfig): 'ios' | 'android' {
  if (device.platform) return device.platform;
  return /iphone|ipad/i.test(device.name) ? 'ios' : 'android';
}

function overrideSafeArea(device: DeviceConfig) {
  console.log(`Capacitor Safe Area Simulator: Overriding for ${device.name}`);

  window.Capacitor = {
    ...window.Capacitor,
    getPlatform: () => platformFor(device),
    isNativePlatform: () => true,
    isPluginAvailable: () => true,
  };

  const StatusBar = getOrRegisterPlugin('StatusBar');
  const SafeArea = getOrRegisterPlugin('SafeArea');

  StatusBar.getInfo = async () => ({ statusBarHeight: device.safeArea.top });
  SafeArea.getSafeAreaInsets = async () => ({ insets: device.safeArea });
}

window.setSimulationStatus = (status) => {
  document.documentElement.style.setProperty('--simulation-active', status.isActive ? 'true' : 'false');
  document.documentElement.style.setProperty('--camera-visible', status.isCameraVisible ? 'true' : 'false');
  document.documentElement.style.setProperty('--current-device', status.currentDeviceName);
};

window.checkSimulationStatus = () => {
  const isActive = document.documentElement.style.getPropertyValue('--simulation-active') === 'true';
  const isCameraVisible = document.documentElement.style.getPropertyValue('--camera-visible') === 'true';
  const currentDeviceName = document.documentElement.style.getPropertyValue('--current-device');
  return { isActive, isCameraVisible, currentDeviceName };
};

window.addEventListener('activateSafeArea', ((event: CustomEvent<DeviceConfig>) => {
  if (event.detail) {
    overrideSafeArea(event.detail);
    window.setSimulationStatus({
      isActive: true,
      isCameraVisible: !!event.detail.camera,
      currentDeviceName: event.detail.name
    });
  } else {
    console.error('Device information not received in activateSafeArea event');
  }
}) as EventListener);

window.addEventListener('resetSafeArea', () => {
  console.log('Capacitor Safe Area Simulator: Resetting Capacitor');
  window.Capacitor = originalCapacitor;
  Object.keys(registeredPlugins).forEach(key => delete registeredPlugins[key]);
  window.setSimulationStatus({
    isActive: false,
    isCameraVisible: false,
    currentDeviceName: ''
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Content script received message:', message);

  switch (message.action) {
    case 'checkSimulationStatus':
      const status = window.checkSimulationStatus();
      // console.log('Checking simulation status:', status);
      sendResponse(status);
      break;
    case 'changeDevice':
    case 'changeBrowser':
    case 'toggleSimulation':
    case 'toggleCamera':
      // Forward these actions to the background script
      chrome.runtime.sendMessage(message, sendResponse);
      return true; // Keeps the message channel open for the asynchronous response
    default:
      // console.log('Unhandled message action:', message.action);
      sendResponse({success: false, error: 'Unhandled message action'});
  }

  return true; // Indicates that we will send a response asynchronously
});


console.log('Content script loaded');
