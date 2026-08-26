# Fuente del PDF para el área de TI

`ti-servidor-propio.print.html` es la maqueta de impresión del documento
`Fiberlux-Despliegue-Servidor-Propio-TI-v1.0.pdf` (una carpeta más arriba).
El contenido es el mismo de `docs/despliegue-ti-fiberlux.md`, redactado en registro
formal y paginado para A4.

Para regenerar el PDF tras editar el HTML (requiere Google Chrome instalado):

```bash
node docs/pdf/render.mjs \
  "$PWD/docs/pdf/ti-servidor-propio.print.html" \
  "$PWD/docs/Fiberlux-Despliegue-Servidor-Propio-TI-v1.0.pdf"
```

El script levanta Chrome en modo headless, carga el HTML y lo imprime por CDP
(`Page.printToPDF`) en A4 con encabezado, pie y numeración de páginas. Al cambiar el
contenido, subir la versión en tres lugares: el bloque de control del HTML, el pie de
página dentro de `render.mjs` y el nombre del archivo PDF.
