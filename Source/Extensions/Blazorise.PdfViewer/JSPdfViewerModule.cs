#region Using directives
using System.Threading.Tasks;
using Blazorise.Modules;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
#endregion

namespace Blazorise.PdfViewer
{
    public class JSPdfViewerModule : BaseJSModule,
         IJSDestroyableModule
    {
        #region Constructors

        /// <summary>
        /// Default module constructor.
        /// </summary>
        /// <param name="jsRuntime">JavaScript runtime instance.</param>
        /// <param name="versionProvider">Version provider.</param>
        public JSPdfViewerModule( IJSRuntime jsRuntime, IVersionProvider versionProvider )
            : base( jsRuntime, versionProvider )
        {
        }

        #endregion

        #region Methods        

        public async ValueTask Initialize( DotNetObjectReference<PdfViewer> dotNetObjectRef,
            ElementReference elementRef, string elementId,
            ElementReference textLayerElementRef, string textLayerElementId,
            object options )
        {
            var moduleInstance = await Module;

            await moduleInstance.InvokeVoidAsync( "initialize", dotNetObjectRef, elementRef, elementId, textLayerElementRef, textLayerElementId, options );
        }

        public async ValueTask Destroy( ElementReference elementRef, string elementId )
        {
            var moduleInstance = await Module;

            await moduleInstance.InvokeVoidAsync( "destroy", elementRef, elementId );
        }

        public async ValueTask SetSource( ElementReference elementRef, string elementId, string value )
        {
            var moduleInstance = await Module;

            await moduleInstance.InvokeVoidAsync( "setSource", elementRef, elementId, value );
        }

        public async ValueTask PreviousPage( ElementReference elementRef, string elementId )
        {
            var moduleInstance = await Module;

            await moduleInstance.InvokeVoidAsync( "prevPage", elementRef, elementId );
        }

        public async ValueTask NextPage( ElementReference elementRef, string elementId )
        {
            var moduleInstance = await Module;

            await moduleInstance.InvokeVoidAsync( "nextPage", elementRef, elementId );
        }

        public async ValueTask ZoomIn( ElementReference elementRef, string elementId, double scale )
        {
            var moduleInstance = await Module;

            await moduleInstance.InvokeVoidAsync( "zoomIn", elementRef, elementId, scale );
        }

        public async ValueTask ZoomOut( ElementReference elementRef, string elementId, double scale )
        {
            var moduleInstance = await Module;

            await moduleInstance.InvokeVoidAsync( "zoomOut", elementRef, elementId, scale );
        }

        #endregion

        #region Properties

        /// <inheritdoc/>
        public override string ModuleFileName => $"./_content/Blazorise.PdfViewer/pdfviewer.js?v={VersionProvider.Version}";

        #endregion
    }
}
