#region Using directives
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Blazorise.Extensions;
using Blazorise.Modules;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
#endregion

namespace Blazorise.PdfViewer
{
    public partial class PdfViewer : BaseComponent,
        IAsyncDisposable
    {
        #region Members

        private DotNetObjectReference<PdfViewer> dotNetObjectRef;

        private string textLayerElementId;

        #endregion

        #region Methods

        protected override void OnInitialized()
        {
            if ( JSModule == null )
            {
                JSModule = new JSPdfViewerModule( JSRuntime, VersionProvider );
            }

            base.OnInitialized();
        }

        /// <inheritdoc/>
        public override async Task SetParametersAsync( ParameterView parameters )
        {
            if ( Initialized && parameters.TryGetValue<string>( nameof( Source ), out var newSource ) && newSource != Source )
            {
                ExecuteAfterRender( () => SetSource( newSource ) );
            }

            await base.SetParametersAsync( parameters );
        }

        /// <inheritdoc/>
        protected override async Task OnAfterRenderAsync( bool firstRender )
        {
            await base.OnAfterRenderAsync( firstRender );

            if ( firstRender )
            {
                dotNetObjectRef ??= DotNetObjectReference.Create( this );

                await JSModule.Initialize( dotNetObjectRef, ElementRef, ElementId, TextLayerElementRef, TextLayerElementId, new
                {
                    Source,
                } );

                Initialized = true;
            }
        }

        /// <inheritdoc/>
        protected override async ValueTask DisposeAsync( bool disposing )
        {
            if ( disposing && Rendered )
            {
                await JSModule.SafeDestroy( ElementRef, ElementId );

                await JSModule.SafeDisposeAsync();

                dotNetObjectRef?.Dispose();
                dotNetObjectRef = null;
            }

            await base.DisposeAsync( disposing );
        }

        /// <summary>
        /// Sets the pdf viewer url.
        /// </summary>
        /// <param name="value">Value to set.</param>
        /// <returns>A task that represents the asynchronous operation.</returns>
        public async Task SetSource( string value )
        {
            if ( !Initialized )
                return;

            await JSModule.SetSource( ElementRef, ElementId, value );
        }

        public async Task PrevPage()
        {
            if ( !Initialized )
                return;

            await JSModule.PrevPage( ElementRef, ElementId );
        }

        public async Task NextPage()
        {
            if ( !Initialized )
                return;

            await JSModule.NextPage( ElementRef, ElementId );
        }

        public async Task ZoomIn( double scale )
        {
            if ( !Initialized )
                return;

            await JSModule.ZoomIn( ElementRef, ElementId, scale );
        }

        public async Task ZoomOut( double scale )
        {
            if ( !Initialized )
                return;

            await JSModule.ZoomOut( ElementRef, ElementId, scale );
        }

        [JSInvokable]
        public Task NotifyPageCount( int pageCount )
        {
            return PageCountChanged.InvokeAsync( pageCount );
        }

        #endregion

        #region Properties

        /// <inheritdoc/>
        protected override bool ShouldAutoGenerateId => true;

        private ElementReference TextLayerElementRef { get; set; }

        protected string TextLayerElementId
        {
            get => textLayerElementId ??= IdGenerator.Generate;
            set => textLayerElementId = value;
        }

        /// <summary>
        /// Gets or sets the <see cref="JSPdfViewerModule"/> instance.
        /// </summary>
        protected JSPdfViewerModule JSModule { get; private set; }

        /// <summary>
        /// Indicates if PdfViewer is properly initialized.
        /// </summary>
        protected bool Initialized { get; set; }

        /// <summary>
        /// Gets or set the javascript runtime.
        /// </summary>
        [Inject] private IJSRuntime JSRuntime { get; set; }

        /// <summary>
        /// Gets or sets the version provider.
        /// </summary>
        [Inject] private IVersionProvider VersionProvider { get; set; }

        /// <summary>
        /// Gets or sets the pdf url.
        /// </summary>
        [Parameter] public string Source { get; set; }

        [Parameter] public EventCallback<int> PageCountChanged { get; set; }

        #endregion
    }
}
