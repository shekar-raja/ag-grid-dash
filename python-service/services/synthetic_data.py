import pandas as pd
from sdv.datasets.local import load_csvs
from sdv.metadata import Metadata

opportunities_df = pd.read_json('/Users/rshekar/Documents/Career/Projects/ag-grid-dash/back-end/data/opportunities-new.json')

metadata = Metadata.detect_from_dataframe(
    data=opportunities_df,
    table_name='opportunities',
    infer_sdtypes=False
)

metadata.update_column(
    column_name='leadId',
    sdtype='id'
)

metadata.update_column(
    column_name='leadName',
    sdtype='categorical'
)

metadata.update_column(
    column_name='phone',
    sdtype='phone_number'
)

metadata.update_column(
    column_name='email',
    sdtype='email'
)

metadata.update_column(
    column_name='status',
    sdtype='categorical'
)

metadata.update_column(
    column_name='priority',
    sdtype='categorical'
)

metadata.update_column(
    column_name='lastInteraction',
    sdtype='categorical'
)

metadata.update_column(
    column_name='followUp',
    sdtype='datetime',
    datetime_format='%Y-%m-%d'
)

metadata.update_column(
    column_name='source',
    sdtype='categorical'
)

metadata.update_column(
    column_name='comments',
    sdtype='categorical'
)

# metadata.set_primary_key(column_name='leadId', table_name='opportunities')

from sdv.single_table import CopulaGANSynthesizer

synthesizer = CopulaGANSynthesizer(metadata)

synthesizer.fit(opportunities_df)

synthetic_data = synthesizer.sample(num_rows=100)

print(synthetic_data.head())