const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = async ( req, res, next ) => {

	const report = req.report;
	const formConfig = {

		item: {
			values: [ report.product ],
			required: 'Enter a product or service'
		},

		barrierSource: {
			type: Form.RADIO,
			values: [ report.source ],
			items: govukItemsFromObj( metadata.barrierSource ),
			validators: [
				{
					fn: validators.isMetadata( 'barrierSource' ),
					message: 'Select how you became aware of the barrier'
				}
			]
		},

		barrierSourceOther: {
			values: [ report.other_source ],
			conditional: { name: 'barrierSource', value: 'OTHER' },
			required: 'Enter how you became aware of the barrier'
		},

		barrierTitle: {
			values: [ report.barrier_title ],
			required: 'Enter a title for this barrier'
		},

		euExitRelated: {
			type: Form.RADIO,
			values: [ report.eu_exit_related ],
			validators: [ {
				fn: validators.isMetadata( 'bool' ),
				message: 'Select whether this is EU exit related or not'
			} ],
			items: govukItemsFromObj( metadata.bool )
		},
	};

	const form = new Form( req, formConfig );

	const processor = new FormProcessor( {
		form,
		render: ( templateValues ) => {

			const hasSectors = ( report.sectors_affected === true );
			const urlMethod = ( hasSectors ? 'sectors' : 'hasSectors' );

			templateValues.backHref =  urls.reports[ urlMethod ]( report.id );

			res.render( 'reports/views/about-problem', templateValues );
		},
		saveFormData: ( formValues ) => backend.reports.saveProblem( req, report.id, formValues ),
		saved: ( body ) => {

			const barrierId = body.id;

			if( form.isExit ){

				res.redirect( urls.reports.detail( barrierId ) );

			} else {

				res.redirect( urls.reports.summary( barrierId ) );
			}
		}
	} );

	try {

		await processor.process();

	} catch( e ){

		next( e );
	}
};
