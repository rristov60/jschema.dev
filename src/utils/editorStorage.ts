const STORAGE_PREFIX = 'schemavisu_';

interface EditorState {
  openTabs: string[];
  activeFile: string | null;
  editedContent: Record<string, string>;
}

const STORAGE_KEYS = {
  OPEN_TABS: `${STORAGE_PREFIX}openTabs`,
  ACTIVE_FILE: `${STORAGE_PREFIX}activeFile`,
  EDITED_CONTENT: `${STORAGE_PREFIX}editedContent`,
};

export const editorStorage = {
  saveOpenTabs(tabs: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(tabs));
    } catch (e) {
      console.error('Failed to save open tabs:', e);
    }
  },

  loadOpenTabs(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load open tabs:', e);
      return [];
    }
  },

  saveActiveFile(filePath: string | null): void {
    try {
      if (filePath) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_FILE, filePath);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_FILE);
      }
    } catch (e) {
      console.error('Failed to save active file:', e);
    }
  },

  loadActiveFile(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_FILE);
    } catch (e) {
      console.error('Failed to load active file:', e);
      return null;
    }
  },

  saveEditedContent(filePath: string, content: string): void {
    try {
      const stored = this.loadAllEditedContent();
      stored[filePath] = content;
      localStorage.setItem(STORAGE_KEYS.EDITED_CONTENT, JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to save edited content:', e);
    }
  },

  loadEditedContent(filePath: string): string | null {
    try {
      const stored = this.loadAllEditedContent();
      return stored[filePath] || null;
    } catch (e) {
      console.error('Failed to load edited content:', e);
      return null;
    }
  },

  loadAllEditedContent(): Record<string, string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EDITED_CONTENT);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load all edited content:', e);
      return {};
    }
  },

  removeEditedContent(filePath: string): void {
    try {
      const stored = this.loadAllEditedContent();
      delete stored[filePath];
      localStorage.setItem(STORAGE_KEYS.EDITED_CONTENT, JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to remove edited content:', e);
    }
  },

  clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.OPEN_TABS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_FILE);
      localStorage.removeItem(STORAGE_KEYS.EDITED_CONTENT);
    } catch (e) {
      console.error('Failed to clear state:', e);
    }
  },

  saveFullState(state: EditorState): void {
    this.saveOpenTabs(state.openTabs);
    this.saveActiveFile(state.activeFile);
    try {
      localStorage.setItem(STORAGE_KEYS.EDITED_CONTENT, JSON.stringify(state.editedContent));
    } catch (e) {
      console.error('Failed to save edited content:', e);
    }
  },

  loadFullState(): EditorState {
    return {
      openTabs: this.loadOpenTabs(),
      activeFile: this.loadActiveFile(),
      editedContent: this.loadAllEditedContent(),
    };
  },

  // Check if a file has unsaved changes
  isDirty(filePath: string, originalContent: string): boolean {
    const edited = this.loadEditedContent(filePath);
    if (!edited) return false;
    return edited !== originalContent;
  },
};

export default editorStorage;
