import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { FontFamily } from '@tiptap/extension-font-family';
import { ArticlesService } from '../../services/articles.service';

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute('width') || el.style.width || null,
        renderHTML: (attrs: { width?: string | null }) =>
          attrs.width ? { style: `width: ${attrs.width};` } : {},
      },
      float: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-float') || null,
        renderHTML: (attrs: { float?: string | null }) =>
          attrs.float ? { 'data-float': attrs.float } : {},
      },
    };
  },
  renderHTML({ HTMLAttributes, node }) {
    const w = node.attrs['width'];
    const f = node.attrs['float'];
    const styleParts: string[] = [];
    if (w) styleParts.push(`width: ${w}`);
    if (f === 'left')  styleParts.push('float: left',  'margin: .2em 1.2em .8em 0');
    if (f === 'right') styleParts.push('float: right', 'margin: .2em 0 .8em 1.2em');
    const style = styleParts.join('; ');

    const attrs: Record<string, string> = { ...HTMLAttributes };
    if (style) attrs['style'] = style;
    if (f) attrs['data-float'] = f;
    return ['img', attrs];
  },
});

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options['types'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: { fontSize?: string | null }) =>
            attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
});

const COLOR_SWATCHES = [
  '#ffffff', '#e8e8e8', '#adaaaa', '#0e0e0e',
  '#ff8a95', '#ff2b40', '#ffb347', '#f5c518',
  '#6ee7b7', '#60a5fa', '#a78bfa', '#f472b6',
];

const HIGHLIGHT_SWATCHES = [
  '#fef08a', '#fbbf24', '#fca5a5', '#ff8a95',
  '#a7f3d0', '#93c5fd', '#c4b5fd', '#f9a8d4',
];

const WIDTH_PRESETS: Array<{ label: string; value: string | null }> = [
  { label: '25%', value: '25%' },
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '100%', value: '100%' },
  { label: 'Auto', value: null },
];

const FONT_FAMILIES: Array<{ label: string; value: string | null }> = [
  { label: 'Predefinito', value: null },
  { label: 'Lexend',      value: 'Lexend, sans-serif' },
  { label: 'Arial',       value: 'Arial, sans-serif' },
  { label: 'Georgia',     value: 'Georgia, serif' },
  { label: 'Times',       value: '"Times New Roman", Times, serif' },
  { label: 'Courier',     value: '"Courier New", Courier, monospace' },
  { label: 'Verdana',     value: 'Verdana, Geneva, sans-serif' },
];

const FONT_SIZES: Array<{ label: string; value: string | null }> = [
  { label: 'Predefinito', value: null },
  { label: '12',          value: '12px' },
  { label: '14',          value: '14px' },
  { label: '16',          value: '16px' },
  { label: '18',          value: '18px' },
  { label: '20',          value: '20px' },
  { label: '24',          value: '24px' },
  { label: '32',          value: '32px' },
  { label: '42',          value: '42px' },
];

type MenuKey = 'color' | 'highlight' | 'image' | 'table' | 'font' | 'size' | null;

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './tiptap-editor.html',
  styleUrl: './tiptap-editor.scss',
})
export class TiptapEditor implements OnInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  initialContent = input<any | null>(null);
  contentChange  = output<{ json: any; html: string }>();

  private articlesService = inject(ArticlesService);
  private editor!: Editor;

  uploading = signal(false);
  openMenu  = signal<MenuKey>(null);
  tick      = signal(0);

  swatches          = COLOR_SWATCHES;
  highlightSwatches = HIGHLIGHT_SWATCHES;
  widthPresets      = WIDTH_PRESETS;
  fontFamilies      = FONT_FAMILIES;
  fontSizes         = FONT_SIZES;

  imageSelected = computed(() => {
    this.tick();
    return this.editor ? this.editor.isActive('image') : false;
  });

  tableActive = computed(() => {
    this.tick();
    return this.editor ? this.editor.isActive('table') : false;
  });

  currentColor = computed(() => {
    this.tick();
    if (!this.editor) return '';
    return (this.editor.getAttributes('textStyle')['color'] as string) ?? '';
  });

  currentHighlight = computed(() => {
    this.tick();
    if (!this.editor) return '';
    return (this.editor.getAttributes('highlight')['color'] as string) ?? '';
  });

  currentFontFamily = computed(() => {
    this.tick();
    if (!this.editor) return null;
    return (this.editor.getAttributes('textStyle')['fontFamily'] as string) ?? null;
  });

  currentFontSize = computed(() => {
    this.tick();
    if (!this.editor) return null;
    return (this.editor.getAttributes('textStyle')['fontSize'] as string) ?? null;
  });

  currentFontFamilyLabel = computed(() => {
    const v = this.currentFontFamily();
    return FONT_FAMILIES.find(f => f.value === v)?.label ?? 'Font';
  });

  currentFontSizeLabel = computed(() => {
    const v = this.currentFontSize();
    return FONT_SIZES.find(s => s.value === v)?.label ?? 'Dim.';
  });

  ngOnInit(): void {
    this.editor = new Editor({
      element: this.hostRef.nativeElement,
      extensions: [
        StarterKit,
        Underline,
        Highlight.configure({ multicolor: true }),
        Subscript,
        Superscript,
        TextStyle,
        Color,
        FontFamily.configure({ types: ['textStyle'] }),
        FontSize,
        Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener', target: '_blank' } }),
        ResizableImage.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: 'tt-img' } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({ resizable: true, HTMLAttributes: { class: 'tt-table' } }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder: 'Scrivi qui il tuo articolo…' }),
      ],
      content: this.initialContent() ?? '',
      onUpdate: ({ editor }) => {
        this.contentChange.emit({ json: editor.getJSON(), html: editor.getHTML() });
        this.tick.update(v => v + 1);
      },
      onSelectionUpdate: () => this.tick.update(v => v + 1),
      onTransaction:     () => this.tick.update(v => v + 1),
    });

    const el = this.hostRef.nativeElement;
    el.addEventListener('drop', this.onDrop);
    el.addEventListener('dragover', this.onDragOver);
    el.addEventListener('paste', this.onPaste);
  }

  ngOnDestroy(): void {
    const el = this.hostRef?.nativeElement;
    if (el) {
      el.removeEventListener('drop', this.onDrop);
      el.removeEventListener('dragover', this.onDragOver);
      el.removeEventListener('paste', this.onPaste);
    }
    this.editor?.destroy();
  }

  @HostListener('document:click')
  onDocClick() { this.openMenu.set(null); }

  // ─── DRAG/DROP & PASTE ─────────────────────────────────────────────────

  private onDragOver = (e: DragEvent) => {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  };

  private onDrop = (e: DragEvent) => {
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    files.forEach(f => this.uploadAndInsert(f));
  };

  private onPaste = (e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imgItem = items.find(i => i.type.startsWith('image/'));
    if (!imgItem) return;
    const file = imgItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    this.uploadAndInsert(file);
  };

  private async uploadAndInsert(file: File): Promise<void> {
    try {
      this.uploading.set(true);
      const url = await this.articlesService.uploadImage(file);
      this.editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      console.error('Upload fallito', err);
    } finally {
      this.uploading.set(false);
    }
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────

  isActive(nameOrAttrs: string | Record<string, any>, attrs?: Record<string, any>): boolean {
    this.tick();
    if (!this.editor) return false;
    if (typeof nameOrAttrs === 'string') {
      return this.editor.isActive(nameOrAttrs, attrs);
    }
    return this.editor.isActive(nameOrAttrs);
  }

  toggleMenu(key: NonNullable<MenuKey>, ev: Event) {
    ev.stopPropagation();
    this.openMenu.update(v => (v === key ? null : key));
  }

  stop(ev: Event) { ev.stopPropagation(); }

  // ─── TEXT FORMATTING ───────────────────────────────────────────────────

  bold()        { this.editor.chain().focus().toggleBold().run(); }
  italic()      { this.editor.chain().focus().toggleItalic().run(); }
  underline()   { this.editor.chain().focus().toggleUnderline().run(); }
  strike()      { this.editor.chain().focus().toggleStrike().run(); }
  subscript()   { this.editor.chain().focus().toggleSubscript().run(); }
  superscript() { this.editor.chain().focus().toggleSuperscript().run(); }
  code()        { this.editor.chain().focus().toggleCode().run(); }
  codeBlock()   { this.editor.chain().focus().toggleCodeBlock().run(); }
  clearFormat() { this.editor.chain().focus().unsetAllMarks().clearNodes().run(); }

  h1() { this.editor.chain().focus().toggleHeading({ level: 1 }).run(); }
  h2() { this.editor.chain().focus().toggleHeading({ level: 2 }).run(); }
  h3() { this.editor.chain().focus().toggleHeading({ level: 3 }).run(); }

  bullet()   { this.editor.chain().focus().toggleBulletList().run(); }
  ordered()  { this.editor.chain().focus().toggleOrderedList().run(); }
  taskList() { this.editor.chain().focus().toggleTaskList().run(); }
  quote()    { this.editor.chain().focus().toggleBlockquote().run(); }
  hr()       { this.editor.chain().focus().setHorizontalRule().run(); }

  alignLeft()    { this.editor.chain().focus().setTextAlign('left').run(); }
  alignCenter()  { this.editor.chain().focus().setTextAlign('center').run(); }
  alignRight()   { this.editor.chain().focus().setTextAlign('right').run(); }
  alignJustify() { this.editor.chain().focus().setTextAlign('justify').run(); }

  undo() { this.editor.chain().focus().undo().run(); }
  redo() { this.editor.chain().focus().redo().run(); }

  // ─── COLOR / HIGHLIGHT ─────────────────────────────────────────────────

  setColor(color: string) {
    this.editor.chain().focus().setColor(color).run();
    this.openMenu.set(null);
  }
  unsetColor() {
    this.editor.chain().focus().unsetColor().run();
    this.openMenu.set(null);
  }

  setHighlight(color: string) {
    this.editor.chain().focus().setHighlight({ color }).run();
    this.openMenu.set(null);
  }
  unsetHighlight() {
    this.editor.chain().focus().unsetHighlight().run();
    this.openMenu.set(null);
  }

  // ─── FONT FAMILY / SIZE ────────────────────────────────────────────────

  setFontFamily(value: string | null) {
    if (value) this.editor.chain().focus().setFontFamily(value).run();
    else       this.editor.chain().focus().unsetFontFamily().run();
    this.openMenu.set(null);
  }

  setFontSize(value: string | null) {
    if (value) this.editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
    else       this.editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
    this.openMenu.set(null);
  }

  // ─── IMAGE ─────────────────────────────────────────────────────────────

  setImageWidth(width: string | null) {
    if (!this.editor.isActive('image')) return;
    this.editor.chain().focus().updateAttributes('image', { width }).run();
  }

  setImageFloat(float: 'left' | 'right' | null) {
    if (!this.editor.isActive('image')) return;
    const attrs: Record<string, any> = { float };
    if (float && !this.editor.getAttributes('image')['width']) {
      attrs['width'] = '45%';
    }
    this.editor.chain().focus().updateAttributes('image', attrs).run();
  }

  removeImage() {
    if (!this.editor.isActive('image')) return;
    this.editor.chain().focus().deleteSelection().run();
    this.openMenu.set(null);
  }

  // ─── TABLE ─────────────────────────────────────────────────────────────

  insertTable() {
    this.editor.chain().focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
    this.openMenu.set(null);
  }
  addColumnBefore() { this.editor.chain().focus().addColumnBefore().run(); }
  addColumnAfter()  { this.editor.chain().focus().addColumnAfter().run(); }
  deleteColumn()    { this.editor.chain().focus().deleteColumn().run(); }
  addRowBefore()    { this.editor.chain().focus().addRowBefore().run(); }
  addRowAfter()     { this.editor.chain().focus().addRowAfter().run(); }
  deleteRow()       { this.editor.chain().focus().deleteRow().run(); }
  deleteTable()     { this.editor.chain().focus().deleteTable().run(); this.openMenu.set(null); }
  toggleHeaderRow() { this.editor.chain().focus().toggleHeaderRow().run(); }
  mergeCells()      { this.editor.chain().focus().mergeCells().run(); }
  splitCell()       { this.editor.chain().focus().splitCell().run(); }

  // ─── LINK ──────────────────────────────────────────────────────────────

  setLink() {
    const prev = this.editor.getAttributes('link')['href'] as string | undefined;
    const url  = prompt('URL del link', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      this.editor.chain().focus().unsetLink().run();
      return;
    }
    this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  onImageInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadAndInsert(file);
    input.value = '';
  }
}
