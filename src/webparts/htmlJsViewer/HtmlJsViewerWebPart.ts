import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneCustomFieldProps,
  type IPropertyPaneField,
  PropertyPaneFieldType,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'HtmlJsViewerWebPartStrings';
import HtmlJsViewer from './components/HtmlJsViewer';
import { IHtmlJsViewerProps } from './components/IHtmlJsViewerProps';
import { DEFAULT_IFRAME_HEIGHT } from './components/SandboxedHtmlRenderer';
import { DEFAULT_HTML_DOCUMENT } from './components/HtmlJsViewer';
import HtmlDocumentEditor from './components/HtmlDocumentEditor';

export interface IHtmlJsViewerWebPartProps {
  htmlDocument?: string;
  iframeHeight?: number;
}

export default class HtmlJsViewerWebPart extends BaseClientSideWebPart<IHtmlJsViewerWebPartProps> {

  private _root: Root | undefined;
  private _propertyPaneRoot: Root | undefined;
  private _previewDocument: string | undefined;

  public render(): void {
    const element: React.ReactElement<IHtmlJsViewerProps> = React.createElement(
      HtmlJsViewer,
      {
        htmlDocument: this._previewDocument ?? this.properties.htmlDocument ?? DEFAULT_HTML_DOCUMENT,
        iframeHeight: this.properties.iframeHeight || DEFAULT_IFRAME_HEIGHT
      }
    );

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }

    this._root.render(element);
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneSlider('iframeHeight', {
                  label: 'Preview height',
                  min: 200,
                  max: 1200,
                  step: 50,
                  value: DEFAULT_IFRAME_HEIGHT,
                  showValue: true
                }),
                this._createEditorField({
                  key: 'htmlDocumentEditor',
                  onRender: domElement => this._renderEditor(domElement),
                  onDispose: () => this._disposeEditor()
                })
              ]
            }
          ]
        }
      ]
    };
  }

  private _createEditorField(properties: IPropertyPaneCustomFieldProps): IPropertyPaneField<IPropertyPaneCustomFieldProps> {
    return {
      type: PropertyPaneFieldType.Custom,
      targetProperty: '',
      properties
    };
  }

  private _renderEditor(domElement: HTMLElement): void {
    if (!this._propertyPaneRoot) {
      this._propertyPaneRoot = createRoot(domElement);
    }

    this._propertyPaneRoot.render(
      React.createElement(HtmlDocumentEditor, {
        value: this.properties.htmlDocument ?? DEFAULT_HTML_DOCUMENT,
        onRunPreview: value => {
          this._previewDocument = value;
          this.render();
        },
        onSave: value => {
          const oldValue = this.properties.htmlDocument;
          this.properties.htmlDocument = value;
          this._previewDocument = value;
          this.onPropertyPaneFieldChanged('htmlDocument', oldValue, value);
          this.render();
        },
        onCancel: () => {
          this._previewDocument = undefined;
          this.render();
        }
      })
    );
  }

  private _disposeEditor(): void {
    this._propertyPaneRoot?.unmount();
    this._propertyPaneRoot = undefined;
  }
}
