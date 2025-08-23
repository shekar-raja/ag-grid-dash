import os
import pandas as pd
from sdv.metadata import Metadata
from sdv.multi_table import HMASynthesizer

data_folder = "/Users/rshekar/Documents/Career/Projects/ag-grid-dash/python-service/data"
if not os.path.exists(data_folder):
    raise FileNotFoundError(f"The specified data folder '{data_folder}' does not exist. Please check the path.")

insurance_data = {}
for file_name in os.listdir(data_folder):
    if file_name.endswith(".json"):
        table_name = file_name[:-5]  # remove ".json"
        file_path = os.path.join(data_folder, file_name)
        insurance_data[table_name] = pd.read_json(file_path)

metadata = Metadata.detect_from_dataframes(data=insurance_data, infer_keys='primary_and_foreign')

lookup_tables = [
    'agent', 'role', 'product_category', 'client_category', 'person',
    'client_relation_type', 'policy_type', 'case', 'offer_relation_type',
    'payout_reason'
]
for table in lookup_tables:
    if 'id' in metadata.tables[table].columns:
        metadata.update_column(table_name=table, column_name='id', sdtype='id')

# For dependent tables with foreign keys:
update_map = {
    'has_role': ['agent_id', 'role_id'],
    'product': ['product_category_id'],
    'client': ['person_id', 'client_category_id'],
    'client_related': ['client_id', 'person_id', 'client_relation_type_id'],
    'offer': ['client_id', 'product_id', 'has_role_id', 'policy_type_id'],
    'signed_offer': ['client_id', 'product_id', 'has_role_id', 'offer_id', 'policy_type_id'],
    'policy': ['signed_offer_id'],
    'opportunity': ['assigned_agent_id'],
    'proposal': ['agent_id', 'policy_id', 'opportunity_id'],
    'commission': ['agent_id', 'policy_id'],
    'in_offer': ['offer_id', 'case_id'],
    'in_signed_offer': ['signed_offer_id', 'case_id'],
    'offer_related': ['signed_offer_id', 'person_id', 'offer_relation_type_id'],
    'payment': ['signed_offer_id', 'person_id', 'client_id'],
    'payout': ['signed_offer_id', 'case_id', 'payout_reason_id', 'person_id', 'client_id']
}
for table_name, columns in update_map.items():
    if table_name not in metadata.tables:
        continue
    for col in columns:
        if col in metadata.tables[table_name].columns:
            metadata.update_column(table_name=table_name, column_name=col, sdtype='id')

metadata.update_column(table_name='policy', column_name='policy_id', sdtype='id')
metadata.tables['policy'].set_primary_key('policy_id')

metadata.add_relationship(
    parent_table_name='agent', parent_primary_key='id',
    child_table_name='has_role', child_foreign_key='agent_id'
)
metadata.add_relationship(
    parent_table_name='role', parent_primary_key='id',
    child_table_name='has_role', child_foreign_key='role_id'
)

# product_category → product
metadata.add_relationship(
    parent_table_name='product_category', parent_primary_key='id',
    child_table_name='product', child_foreign_key='product_category_id'
)

# person, client_category → client
metadata.add_relationship(
    parent_table_name='person', parent_primary_key='id',
    child_table_name='client', child_foreign_key='person_id'
)
metadata.add_relationship(
    parent_table_name='client_category', parent_primary_key='id',
    child_table_name='client', child_foreign_key='client_category_id'
)

# client, person, client_relation_type → client_related
metadata.add_relationship(
    parent_table_name='client', parent_primary_key='id',
    child_table_name='client_related', child_foreign_key='client_id'
)
metadata.add_relationship(
    parent_table_name='person', parent_primary_key='id',
    child_table_name='client_related', child_foreign_key='person_id'
)
metadata.add_relationship(
    parent_table_name='client_relation_type', parent_primary_key='id',
    child_table_name='client_related', child_foreign_key='client_relation_type_id'
)

# client, product, has_role, policy_type → offer
metadata.add_relationship(
    parent_table_name='client', parent_primary_key='id',
    child_table_name='offer', child_foreign_key='client_id'
)
metadata.add_relationship(
    parent_table_name='product', parent_primary_key='id',
    child_table_name='offer', child_foreign_key='product_id'
)
metadata.add_relationship(
    parent_table_name='has_role', parent_primary_key='id',
    child_table_name='offer', child_foreign_key='has_role_id'
)
metadata.add_relationship(
    parent_table_name='policy_type', parent_primary_key='id',
    child_table_name='offer', child_foreign_key='policy_type_id'
)

# client, product, has_role, offer, policy_type → signed_offer
metadata.add_relationship(
    parent_table_name='client', parent_primary_key='id',
    child_table_name='signed_offer', child_foreign_key='client_id'
)
metadata.add_relationship(
    parent_table_name='product', parent_primary_key='id',
    child_table_name='signed_offer', child_foreign_key='product_id'
)
metadata.add_relationship(
    parent_table_name='has_role', parent_primary_key='id',
    child_table_name='signed_offer', child_foreign_key='has_role_id'
)
metadata.add_relationship(
    parent_table_name='offer', parent_primary_key='id',
    child_table_name='signed_offer', child_foreign_key='offer_id'
)
metadata.add_relationship(
    parent_table_name='policy_type', parent_primary_key='id',
    child_table_name='signed_offer', child_foreign_key='policy_type_id'
)

# signed_offer → policy
metadata.add_relationship(
    parent_table_name='signed_offer', parent_primary_key='id',
    child_table_name='policy', child_foreign_key='signed_offer_id'
)

# agent → opportunity
metadata.add_relationship(
    parent_table_name='agent', parent_primary_key='id',
    child_table_name='opportunity', child_foreign_key='assigned_agent_id'
)

# agent, policy, opportunity → proposal
metadata.add_relationship(
    parent_table_name='agent', parent_primary_key='id',
    child_table_name='proposal', child_foreign_key='agent_id'
)
metadata.add_relationship(
    parent_table_name='policy', parent_primary_key='policy_id',
    child_table_name='proposal', child_foreign_key='policy_id'
)
metadata.add_relationship(
    parent_table_name='opportunity', parent_primary_key='id',
    child_table_name='proposal', child_foreign_key='opportunity_id'
)

# agent, policy → commission
metadata.add_relationship(
    parent_table_name='agent', parent_primary_key='id',
    child_table_name='commission', child_foreign_key='agent_id'
)
metadata.add_relationship(
    parent_table_name='policy', parent_primary_key='policy_id',
    child_table_name='commission', child_foreign_key='policy_id'
)

# offer, case → in_offer
metadata.add_relationship(
    parent_table_name='offer', parent_primary_key='id',
    child_table_name='in_offer', child_foreign_key='offer_id'
)
metadata.add_relationship(
    parent_table_name='case', parent_primary_key='id',
    child_table_name='in_offer', child_foreign_key='case_id'
)

# signed_offer, case → in_signed_offer
metadata.add_relationship(
    parent_table_name='signed_offer', parent_primary_key='id',
    child_table_name='in_signed_offer', child_foreign_key='signed_offer_id'
)
metadata.add_relationship(
    parent_table_name='case', parent_primary_key='id',
    child_table_name='in_signed_offer', child_foreign_key='case_id'
)

# signed_offer, person, offer_relation_type → offer_related
metadata.add_relationship(
    parent_table_name='signed_offer', parent_primary_key='id',
    child_table_name='offer_related', child_foreign_key='signed_offer_id'
)
metadata.add_relationship(
    parent_table_name='person', parent_primary_key='id',
    child_table_name='offer_related', child_foreign_key='person_id'
)
metadata.add_relationship(
    parent_table_name='offer_relation_type', parent_primary_key='id',
    child_table_name='offer_related', child_foreign_key='offer_relation_type_id'
)

# signed_offer, person/client → payment
metadata.add_relationship(
    parent_table_name='signed_offer', parent_primary_key='id',
    child_table_name='payment', child_foreign_key='signed_offer_id'
)
metadata.add_relationship(
    parent_table_name='person', parent_primary_key='id',
    child_table_name='payment', child_foreign_key='person_id'
)
metadata.add_relationship(
    parent_table_name='client', parent_primary_key='id',
    child_table_name='payment', child_foreign_key='client_id'
)

# signed_offer, case, payout_reason, person/client → payout
metadata.add_relationship(
    parent_table_name='signed_offer', parent_primary_key='id',
    child_table_name='payout', child_foreign_key='signed_offer_id'
)
metadata.add_relationship(
    parent_table_name='case', parent_primary_key='id',
    child_table_name='payout', child_foreign_key='case_id'
)
metadata.add_relationship(
    parent_table_name='payout_reason', parent_primary_key='id',
    child_table_name='payout', child_foreign_key='payout_reason_id'
)
metadata.add_relationship(
    parent_table_name='person', parent_primary_key='id',
    child_table_name='payout', child_foreign_key='person_id'
)
metadata.add_relationship(
    parent_table_name='client', parent_primary_key='id',
    child_table_name='payout', child_foreign_key='client_id'
)

synthesizer = HMASynthesizer(metadata=metadata)
synthesizer.fit(insurance_data)

num_rows_map = {}
all_tables_in_metadata = list(metadata.tables.keys())
for tbl in all_tables_in_metadata:
    if tbl in lookup_tables:
        num_rows_map[tbl] = 15
    else:
        num_rows_map[tbl] = 300

# Generate synthetic data with custom row counts
synthetic_data = synthesizer.sample(num_rows=num_rows_map)

synthetic_data_folder = "/Users/rshekar/Documents/Career/Projects/ag-grid-dash/python-service/data/synthetic_data"
os.makedirs(synthetic_data_folder, exist_ok=True)

for table_name, df in synthetic_data.items():
    output_file = os.path.join(synthetic_data_folder, f"{table_name}.json")
    df.to_json(output_file, orient='records', indent=4)
    print(f"Saved synthetic data for table '{table_name}' with {len(df)} rows → {output_file}")

# (Optional) Save the synthesizer model itself
model_path = '/Users/rshekar/Documents/Career/Projects/ag-grid-dash/python-service/synthetic_data/insurance_data_synthesizer.pkl'
synthesizer.save(filepath=model_path)
print(f"Synthesizer model saved to: {model_path}")