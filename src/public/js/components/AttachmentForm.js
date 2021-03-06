ma.components.AttachmentForm = (function( jessie ){

	if( !( ma.xhr2 && ( typeof FormData !== 'undefined' ) && jessie.bind ) ){ return; }

	var bind = jessie.bind;

	function AttachmentForm( fileUpload, attachments, submitButton, deleteUrl ){

		if( !fileUpload ){ throw new Error( 'fileUpload is required' ); }
		if( !attachments ){ throw new Error( 'attachments is required' ); }
		if( !submitButton ){ throw new Error( 'submitButton is required' ); }
		if( !deleteUrl ){ throw new Error( 'deleteUrl is required' ); }

		this.fileUpload = fileUpload;
		this.attachments = attachments;
		this.submitButton = submitButton;
		this.deleteUrl = deleteUrl;

		fileUpload.events.file.subscribe( bind( this.newFile, this ) );
		attachments.events.delete.subscribe( bind( this.deleteDocument, this ) );

	}

	AttachmentForm.prototype.showError = function( message ){

		this.submitButton.disabled = false;
		this.fileUpload.setError( message );
		this.fileUpload.showLink();
	};

	AttachmentForm.prototype.updateProgress = function( e ){

		if( e.lengthComputable ){

			if( e.loaded === e.total ){

				this.fileUpload.setProgress( 'scanning file for viruses...' );

			} else {

				this.fileUpload.setProgress( 'uploading file... ' + Math.floor( ( e.loaded / e.total ) * 100 ) + '%' );
			}
		}
	};

	AttachmentForm.prototype.transferFailed = function(){

		this.showError( 'Upload of document cancelled, try again.' );
	};

	AttachmentForm.prototype.transferCanceled = function(){

		this.showError( 'Upload of document cancelled, try again.' );
	};

	AttachmentForm.prototype.loaded = function( e ){

		var xhr = e.target;
		var responseCode = xhr.status;
		var data;

		try {

			data = JSON.parse( xhr.response );

		} catch( e ){

			data = {};
		}

		if( responseCode === 200 ){

			var documentId = data.documentId;
			var file = data.file;

			if( documentId && file ){

				this.submitButton.disabled = false;
				this.fileUpload.showLink();
				this.attachments.addItem( {
					id: documentId,
					name: file.name,
					size: file.size
				} );

			} else {

				this.showError( 'There was an issue uploading the document, try again' );
			}

		} else if( responseCode === 401 ){

			this.showError( data.message );

		} else {

			var message = ( data.message || 'A system error has occured, so the file has not been uploaded. Try again.' );
			this.showError( message );
		}
	};

	AttachmentForm.prototype.newFile = function( file ){

		var xhr2 = ma.xhr2();
		var formData = new FormData();

		this.submitButton.disabled = true;
		formData.append( 'document', file );

		if( xhr2.upload ){

			xhr2.upload.addEventListener( 'progress', bind( this.updateProgress, this ), false );
		}

		xhr2.addEventListener( 'error', bind( this.transferFailed, this ), false );
		xhr2.addEventListener( 'abort', bind( this.transferCanceled, this ), false );
		xhr2.addEventListener( 'load', bind( this.loaded, this ), false );

		xhr2.open( 'POST', this.fileUpload.action, true );
		xhr2.send( formData );

		this.fileUpload.setProgress( 'uploading file... 0%' );
	};

	AttachmentForm.prototype.deleteDocument = function( documentId ){

		if( !documentId ){ return; }

		var xhr = ma.xhr2();
		var url = this.deleteUrl.replace( ':uuid', documentId );

		xhr.open( 'POST', url, true );
		xhr.send();

		this.attachments.removeItem( documentId );
	};

	return AttachmentForm;

}( jessie ));
