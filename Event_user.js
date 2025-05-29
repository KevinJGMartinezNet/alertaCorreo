/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/email', 'N/runtime', 'N/record', 'N/search', 'N/file', 'N/url'],
function(email, runtime, record, search, file, url) {

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        var newRecord = context.newRecord;
        var recordId = newRecord.id;
        var recordType = newRecord.type;

        var fileIds = getAttachedFileIds(recordType, recordId);

        if (fileIds.length > 0) {
            var tranid = newRecord.getValue('tranid');

            var recordUrl = url.resolveRecord({
                recordType: recordType,
                recordId: recordId,
                isEditMode: false
            });
        
            var body = 'Se han adjuntado los siguientes archivos al pedido <a href="' + recordUrl + '">' + tranid + '</a>: <br><ul>';
        
            fileIds.forEach(function(f) {
                if (f.id) {
                    body += '<li>' + f.name + '</li>'; 
                }
            });
        
            body += '</ul>';
        
            email.send({
                author: runtime.getCurrentUser().id,
                recipients: ['tucorreo@dominio.com'],
                subject: 'Archivos adjuntos al pedido ' + tranid,
                body: body,
                relatedRecords: {
                    transactionId: recordId
                }
            });
        }
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
        }).filter(function(f) {
            return !!f.id; 
        });
    }

    return {
        afterSubmit: afterSubmit
    };
});
