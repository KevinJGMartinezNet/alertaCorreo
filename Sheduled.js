/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/email', 'N/runtime', 'N/record', 'N/file', 'N/format'],
function(search, email, runtime, record, file, format) {

    function execute(context) {
        var pedidos = getRecentSalesOrders();

        pedidos.forEach(function(pedido) {
            var fileIds = getAttachedFileIds('salesorder', pedido.id);
            fileIds.forEach(function(f) {
                if (!wasFileAlreadyNotified(f.id, pedido.id)) {
                    sendNotificationEmail(pedido.tranid, f);
                    markFileAsNotified(f, pedido.id);
                }
            });
        });
    }

function getRecentSalesOrders() {
    var sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    var formattedDate = format.format({
        value: sevenDaysAgo,
        type: format.Type.DATE
    });

    var results = search.create({
        type: 'salesorder',
        filters: [
            ['mainline', 'is', 'T'],
            'AND',
            ['lastmodifieddate', 'onorafter', formattedDate]
        ],
        columns: ['internalid', 'tranid']
    }).run().getRange({ start: 0, end: 100 });

    return results.map(function(r) {
        return {
            id: r.getValue('internalid'),
            tranid: r.getValue('tranid')
        };
    });
}

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
        });
    }

    function wasFileAlreadyNotified(fileId, pedidoId) {
        var results = search.create({
            type: 'customrecord_file_notify',
            filters: [
                ['custrecord_fn_file', 'anyof', fileId],
                'AND',
                ['custrecord_fn_pedido', 'anyof', pedidoId]
            ]
        }).run().getRange({ start: 0, end: 1 });

        return results.length > 0;
    }

    function markFileAsNotified(file, pedidoId) {
        record.create({
            type: 'customrecord_file_notify',
            isDynamic: true
        })
        .setValue({ fieldId: 'custrecord_fn_file', value: file.id })
        .setValue({ fieldId: 'custrecord_fn_filename', value: file.name })
        .setValue({ fieldId: 'custrecord_fn_pedido', value: pedidoId })
        .save();
    }

    function sendNotificationEmail(tranid, fileInfo) {
        var fileObj = file.load({ id: fileInfo.id });

        var body = 'Se ha adjuntado un nuevo archivo al pedido ' + tranid + ':<br><br>';
        body += '<a href="' + fileObj.url + '">' + fileInfo.name + '</a>';

        email.send({
            author: runtime.getCurrentUser().id,
            recipients: ['tucorreo@dominio.com'],
            subject: 'Nuevo archivo adjunto en Pedido ' + tranid,
            body: body
        });
    }

    return {
        execute: execute
    };
});
