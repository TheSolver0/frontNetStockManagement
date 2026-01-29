import React, { useState } from 'react';
import { Card, Grid, Button, Drawer, Descriptions } from 'antd';

export default function ResponsiveTable({ table, renderTable, onRowClick, renderActions }) {
  const screens = Grid.useBreakpoint();
  const rows = table.getRowModel().rows;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const openRow = (row) => {
    setSelectedRow(row);
    setDrawerVisible(true);
    if (onRowClick) onRowClick(row);
  };

  // Mobile: show cards
  if (!screens.lg) {
    return (
      <div className="responsive-cards">
        {rows.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Aucune donnée</div>}
        {rows.map(row => (
          <Card
            key={row.id}
            className="mobile-card"
            size="small"
            bordered
            hoverable
            onClick={() => openRow(row)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>
                {row.original.name || row.original.nom || `#${row.original.id}`}
              </div>
              <div>
                {renderActions ? renderActions(row) : (
                  <Button size="small" onClick={(e) => { e.stopPropagation(); openRow(row); }}>Voir</Button>
                )}
              </div>
            </div>

            <div>
              {row.getVisibleCells().slice(0, 4).map(cell => (
                <div key={cell.id} className="card-row">
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}</div>
                  <div style={{ fontWeight: 600 }}>{String(cell.getValue())}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Drawer
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          title={selectedRow ? (selectedRow.original.name || selectedRow.original.nom || `#${selectedRow.original.id}`) : 'Détails'}
          width={Math.min(520, window.innerWidth - 40)}
        >
          {selectedRow ? (
            <Descriptions column={1} size="small">
              {selectedRow.getVisibleCells().map(cell => (
                <Descriptions.Item key={cell.id} label={typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}>
                  {String(cell.getValue())}
                </Descriptions.Item>
              ))}
            </Descriptions>
          ) : null}

          <div style={{ marginTop: 12 }}>
            {renderActions ? renderActions(selectedRow) : null}
          </div>
        </Drawer>
      </div>
    );
  }

  // Desktop: render provided table markup
  return (
    <div className="table-responsive">
      {renderTable ? renderTable() : null}
    </div>
  );
}
