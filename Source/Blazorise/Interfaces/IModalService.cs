﻿#region Using directives
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
#endregion

namespace Blazorise
{
    /// <summary>
    /// Together with ModalProvider, handles the instantiation of modals with custom content.
    /// </summary>
    public interface IModalService
    {

        /// <summary>
        /// Required Modal Provider that manages the instantiation of modals with custom content.
        /// </summary>
        public ModalProvider ModalProvider { get; }

        /// <summary>
        /// Sets the required Modal Provider.
        /// </summary>
        /// <param name="modalProvider"></param>
        public void SetModalProvider( ModalProvider modalProvider );

        /// <summary>
        /// Shows a Modal where the content is TComponent.
        /// </summary>
        /// <typeparam name="TComponent"></typeparam>
        public Task<ModalInstance> Show<TComponent>();

        /// <summary>
        /// Shows a Modal where the content is TComponent.
        /// </summary>
        /// <typeparam name="TComponent"></typeparam>
        /// <param name="title"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show<TComponent>( string title );

        /// <summary>
        /// Shows a Modal where the content is TComponent.
        /// </summary>
        /// <typeparam name="TComponent"></typeparam>
        /// <param name="parameters"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show<TComponent>( Action<ModalProviderParameterBuilder<TComponent>> parameters );

        /// <summary>
        /// Shows a Modal where the content is TComponent.
        /// </summary>
        /// <typeparam name="TComponent"></typeparam>
        /// <param name="parameters"></param>
        /// <param name="modalProviderOptions"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show<TComponent>( Action<ModalProviderParameterBuilder<TComponent>> parameters, ModalProviderOptions modalProviderOptions );

        /// <summary>
        /// Shows a Modal where the content is TComponent.
        /// </summary>
        /// <typeparam name="TComponent"></typeparam>
        /// <param name="title"></param>
        /// <param name="parameters"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show<TComponent>( string title, Action<ModalProviderParameterBuilder<TComponent>> parameters );

        /// <summary>
        /// Shows a Modal where the content is TComponent.
        /// </summary>
        /// <typeparam name="TComponent"></typeparam>
        /// <param name="title"></param>
        /// <param name="modalProviderOptions"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show<TComponent>( string title, ModalProviderOptions modalProviderOptions );

        /// <summary>
        /// Shows a Modal where the content is TComponent.
        /// </summary>
        /// <typeparam name="TComponent"></typeparam>
        /// <param name="title"></param>
        /// <param name="parameters"></param>
        /// <param name="modalProviderOptions"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show<TComponent>( string title, Action<ModalProviderParameterBuilder<TComponent>> parameters, ModalProviderOptions modalProviderOptions );

        /// <summary>
        /// Shows a Modal where the content is of componentType.
        /// </summary>
        /// <param name="componentType"></param>
        public Task<ModalInstance> Show( Type componentType );

        /// <summary>
        /// Shows a Modal where the content is of componentType.
        /// </summary>
        /// <param name="title"></param>
        /// <param name="componentType"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show( string title, Type componentType );

        /// <summary>
        /// Shows a Modal where the content is of componentType.
        /// </summary>
        /// <param name="title"></param>
        /// <param name="componentType"></param>
        /// <param name="componentParameters"></param>
        /// <param name="modalProviderOptions"></param>
        /// <returns></returns>
        public Task<ModalInstance> Show( string title, Type componentType, Dictionary<string, object> componentParameters = null, ModalProviderOptions modalProviderOptions = null );

        /// <summary>
        /// Hides currently opened modal.
        /// </summary>
        /// <returns></returns>
        public Task Hide();
    }
}
