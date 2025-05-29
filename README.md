# Alerta Correo Electónico Comunicación > Archivos en Netsuite

Hace unos días me pidieron hacer un script donde, les llegue un correo electrónico cada vez que suban un archivo en Netsuite, en el apartado de Transacciones > Pedido/Orden de compra > Subficha Comunicación > Archivos. 

Yo acepte pensando que sería muy sencillo hacer ese script, y estuve muy equivocado, ya que no había manera de como extraer la información, tanto usando consultas ni mediante "mediaItem", cheque en foros y no pude encontrar ninguna manera de poder sacar información ya que muchos usuarios tenían ese problema.

Hasta que me puse manos a la obra, para poder ver si podía hacer ese Script, ya que lo necesitaban de manera urgente, de tanta investigación que hice encontré dos formas de hacerlo mediante un UserEventScript o ScheduledScript.


## UserEventScript
  Este código funciona cuando le ponen en editar el formulario y suben el archivo directamente desde Comunicación > Archivos al momento de poder guardar el formulario automáticamente les llegará un correo a los que hayas puesto dentro del Script y los archivos que se pusieron, ya que no encontré la manera de que funcione sin tener que editar el formulario, posiblemente si exista una manera pero actualmente no me fue posible.

## SheduleScript
  Este código no sirve a tiempo real, lo puedes cornometrar cada 15 minutos o 1 hora u etc, ya dependiendo de cada cuanto tiempo lo requieras, lo que hace el script es que busca en todos los archivos nuevos para poder detectar si se subió uno nuevo y manda el correo electrónico, en caso de que no exista ningún archivo no hace nada y no manda el correo.

## Fragmento de código donde hace la busqueda de información de los archivos

  function getAttachedFileIds(recordType, recordId) {
        var results = search.create({
            type: recordType,
            filters: [
                ['internalid', 'anyof', recordId],
                'AND',
                ['mainline', 'is', 'T']
            ],
            columns: [
                search.createColumn({ name: 'internalid', join: 'file' }),
                search.createColumn({ name: 'name', join: 'file' })
            ]
        }).run().getRange({ start: 0, end: 100 });

        return (results || []).map(function(result) {
            return {
                id: result.getValue({ name: 'internalid', join: 'file' }),
                name: result.getValue({ name: 'name', join: 'file' })
            };
        }).filter(function(f) {
            return !!f.id; 
        });
    }
Estos fueron la manera que pude encontrar para poder "solucionar esa problemática", los que están leyendo el post encontraron la manera de hacerlo mejor me encnataría saber sus comentarios.
