//import "./vendors/pdf.min.js";
//import "./vendors/pdf.worker.min.js";

//document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<link rel=\"stylesheet\" href=\"_content/Blazorise.PdfViewer/vendors/pdf_viewer.min.js\" />");
//document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<script src=\"_content/Blazorise.PdfViewer/vendors/pdf.min.js\"></script>");
//document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<script src=\"_content/Blazorise.PdfViewer/vendors/pdf.worker.min.js\"></script>");
import { getRequiredElement } from "../Blazorise/utilities.js?v=1.0.3.0";

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';

const _instances = [];

export function initialize(dotNetObjectRef, element, elementId, textLayerElement, textLayerElementId, options) {
    const canvas = getRequiredElement(element, elementId);
    textLayerElement = getRequiredElement(textLayerElement, textLayerElementId);

    const context = canvas.getContext("2d");

    const instance = {
        dotNetObjectRef: dotNetObjectRef,
        elementId: elementId,
        //pdf: pdf,
        pageNum: 1,
        //numPages: 1,
        canvas: canvas,
        textLayerElement: textLayerElement,
        context: context,
        pageRendering: false,
        pageNumPending: null,
        scale: options.scale || 1.5,
    };

    _instances[elementId] = instance;

    loadPdf(instance, "/assets/compressed.tracemonkey-pldi-09.pdf", 1);

    //const loadingTask = pdfjsLib.getDocument("/assets/compressed.tracemonkey-pldi-09.pdf"/*options.source*/);

    //loadingTask.promise.then(function (pdf) {
    //    const instance = {
    //        dotNetObjectRef: dotNetObjectRef,
    //        elementId: elementId,
    //        pdf: pdf,
    //        canvas: canvas,
    //        context: context,
    //        pageNum: 1,
    //        numPages: pdf.numPages,
    //        pageRendering: false,
    //        pageNumPending: null,
    //        scale: 1.5,
    //    };

    //    _instances[elementId] = instance;

    //    // Initial/first page rendering
    //    renderPage(instance, 1);
    //});
}

export function destroy(element, elementId) {
    const instance = _instances[elementId];

    if (instance) {
        //instance.editor.toTextArea();
        //instance.editor = null;

        delete _instances[elementId];
    }
}

export function setSource(elementId, source) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        loadPdf(instance, source, 1);
    }
}

function loadPdf(instance, source, pageNum) {
    const loadingTask = pdfjsLib.getDocument(source);

    loadingTask.promise.then(function (pdf) {
        instance.pdf = pdf;
        instance.pageNum = pageNum;
        instance.numPages = pdf.numPages;

        renderPage(instance, pageNum);
    });
}

function renderPage(instance, pageNum) {
    instance.pageRendering = true;
    // Using promise to fetch the page

    instance.pdf.getPage(pageNum).then(function (page) {
        var viewport = page.getViewport({ scale: instance.scale });
        instance.canvas.height = viewport.height;
        instance.canvas.width = viewport.width;

        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: instance.context,
            viewport: viewport
        };

        var renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function () {
            instance.pageRendering = false;
            if (instance.pageNumPending !== null) {
                // New page rendering is pending
                renderPage(instance, instance.pageNumPending);
                instance.pageNumPending = null;
            }
        }).then(function () {
            return page.getTextContent();
        }).then(function (textContent) {
            instance.textLayerElement.style.left = instance.canvas.offsetLeft + 'px';
            instance.textLayerElement.style.top = instance.canvas.offsetTop + 'px';
            instance.textLayerElement.style.height = instance.canvas.offsetHeight + 'px';
            instance.textLayerElement.style.width = instance.canvas.offsetWidth + 'px';

            // Pass the data to the method for rendering of text over the pdf canvas.
            pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: instance.textLayerElement,
                viewport: viewport,
                textDivs: []
            });
        });
    });

    // Update page counters
    //document.getElementById('page_num').textContent = num;
}

function queueRenderPage(instance, pageNum) {
    if (instance.pageRendering) {
        instance.pageNumPending = pageNum;
    } else {
        renderPage(instance, pageNum);
    }
}

export function prevPage(element, elementId) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        if (instance.pageNum <= 1) {
            return;
        }
        instance.pageNum--;
        queueRenderPage(instance, instance.pageNum);
    }
}

export function nextPage(element, elementId) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        if (instance.pageNum >= instance.pdf.numPages) {
            return;
        }
        instance.pageNum++;
        queueRenderPage(instance, instance.pageNum);
    }
}

export function zoomIn(element, elementId, scale) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        instance.scale += scale;
        queueRenderPage(instance, instance.pageNum);
    }
}

export function zoomOut(element, elementId, scale) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        instance.scale -= scale;
        queueRenderPage(instance, instance.pageNum);
    }
}