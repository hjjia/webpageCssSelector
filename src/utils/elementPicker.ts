export interface PickerOptions {
  onElementSelected?: (element: Element) => void;
  onPickerActivated?: () => void;
  onPickerDeactivated?: () => void;
}

class ElementPicker {
  private isActive = false;
  private overlay: HTMLDivElement | null = null;
  private highlightBox: HTMLDivElement | null = null;
  private options: PickerOptions;
  private boundHandlers: {
    mouseover: (e: MouseEvent) => void;
    mouseout: (e: MouseEvent) => void;
    click: (e: MouseEvent) => void;
    keydown: (e: KeyboardEvent) => void;
  };

  constructor(options: PickerOptions = {}) {
    this.options = options;
    
    // Bind event handlers
    this.boundHandlers = {
      mouseover: this.handleMouseOver.bind(this),
      mouseout: this.handleMouseOut.bind(this),
      click: this.handleClick.bind(this),
      keydown: this.handleKeyDown.bind(this)
    };
  }

  activate(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.createOverlay();
    this.addEventListeners();
    this.options.onPickerActivated?.();
    
    // Change cursor to crosshair
    document.body.style.cursor = 'crosshair';
  }

  deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeOverlay();
    this.removeEventListeners();
    this.options.onPickerDeactivated?.();
    
    // Restore cursor
    document.body.style.cursor = '';
  }

  private createOverlay(): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.1);
      z-index: 999999;
      pointer-events: none;
    `;
    
    // Create highlight box
    this.highlightBox = document.createElement('div');
    this.highlightBox.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 1000000;
      transition: all 0.1s ease;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
    `;
    
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.highlightBox);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    
    if (this.highlightBox) {
      document.body.removeChild(this.highlightBox);
      this.highlightBox = null;
    }
  }

  private addEventListeners(): void {
    document.addEventListener('mouseover', this.boundHandlers.mouseover, true);
    document.addEventListener('mouseout', this.boundHandlers.mouseout, true);
    document.addEventListener('click', this.boundHandlers.click, true);
    document.addEventListener('keydown', this.boundHandlers.keydown, true);
  }

  private removeEventListeners(): void {
    document.removeEventListener('mouseover', this.boundHandlers.mouseover, true);
    document.removeEventListener('mouseout', this.boundHandlers.mouseout, true);
    document.removeEventListener('click', this.boundHandlers.click, true);
    document.removeEventListener('keydown', this.boundHandlers.keydown, true);
  }

  private handleMouseOver(e: MouseEvent): void {
    if (!this.isActive || !this.highlightBox) return;
    
    const target = e.target as Element;
    if (!target || target === this.overlay || target === this.highlightBox) return;
    
    const rect = target.getBoundingClientRect();
    
    this.highlightBox.style.left = `${rect.left}px`;
    this.highlightBox.style.top = `${rect.top}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;
    this.highlightBox.style.display = 'block';
  }

  private handleMouseOut(e: MouseEvent): void {
    if (!this.isActive || !this.highlightBox) return;
    
    const target = e.target as Element;
    if (!target || target === this.overlay || target === this.highlightBox) return;
    
    // Only hide if we're not moving to a child element
    const relatedTarget = e.relatedTarget as Element;
    if (!relatedTarget || !target.contains(relatedTarget)) {
      this.highlightBox.style.display = 'none';
    }
  }

  private handleClick(e: MouseEvent): void {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as Element;
    if (!target || target === this.overlay || target === this.highlightBox) return;
    
    this.options.onElementSelected?.(target);
    this.deactivate();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isActive) return;
    
    // Escape key to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      this.deactivate();
    }
  }

  isPickerActive(): boolean {
    return this.isActive;
  }
}

// Global instance
let pickerInstance: ElementPicker | null = null;

export const activateElementPicker = (options: PickerOptions = {}): ElementPicker => {
  // Deactivate existing picker if any
  if (pickerInstance) {
    pickerInstance.deactivate();
  }
  
  pickerInstance = new ElementPicker(options);
  pickerInstance.activate();
  
  return pickerInstance;
};

export const deactivateElementPicker = (): void => {
  if (pickerInstance) {
    pickerInstance.deactivate();
    pickerInstance = null;
  }
};

export const isElementPickerActive = (): boolean => {
  return pickerInstance?.isPickerActive() ?? false;
};

// Content script integration
export const injectElementPicker = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Since content script is already injected via manifest.json,
      // we just need to resolve immediately
      resolve();
    } catch (error) {
      console.error('Failed to inject element picker:', error);
      reject(error);
    }
  });
};