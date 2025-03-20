/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useState } from 'react';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiButton } from '@elastic/eui';
import dompurify from 'dompurify';
import { TableCell } from './table_cell';
import { DocViewerLinks } from '../doc_viewer_links/doc_viewer_links';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { fetchSourceTypeDataCell } from '../data_grid/data_grid_table_cell_value';

export interface TableRowProps {
  row: OpenSearchSearchHit;
  columns: string[];
  indexPattern: IndexPattern;
  onRemoveColumn: (column: string) => void;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onClose: () => void;
  isShortDots: boolean;
}

export const TableRow = ({
  row,
  columns,
  indexPattern,
  onRemoveColumn,
  onAddColumn,
  onFilter,
  onClose,
  isShortDots,
}: TableRowProps) => {
  const flattened = indexPattern.flattenHit(row);
  const [isExpanded, setIsExpanded] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<OpenSearchSearchHit | null>(null);

  const tableRow = (
    <tr key={row._id}>
      <td data-test-subj="docTableExpandToggleColumn" className="osdDocTableCell__toggleDetails">
        <EuiButtonIcon
          color="text"
          onClick={() => setIsExpanded(!isExpanded)}
          iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
          aria-label="Next"
          data-test-subj="docTableExpandToggleColumn"
        />
      </td>
      {columns.map((colName) => {
        const fieldInfo = indexPattern.fields.getByName(colName);
        const fieldMapping = flattened[colName];

        if (typeof row === 'undefined') {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <span>-</span>
            </td>
          );
        }

        if (fieldInfo?.type === '_source') {
          return (
            <td
              key={colName}
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord osdDocTableCell__source"
              data-test-subj="docTableField"
            >
              <div className="truncate-by-height">
                {fetchSourceTypeDataCell(indexPattern, row, colName, false, isShortDots)}
              </div>
            </td>
          );
        }

        const formattedValue = indexPattern.formatField(row, colName);

        if (typeof formattedValue === 'undefined') {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <span>-</span>
            </td>
          );
        }

        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        if (!fieldInfo?.filterable) {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <div className="truncate-by-height">
                {/* eslint-disable-next-line react/no-danger */}
                <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
              </div>
            </td>
          );
        }

        return (
          <TableCell
            key={colName}
            columnId={colName}
            onFilter={onFilter}
            isTimeField={indexPattern.timeFieldName === colName}
            fieldMapping={fieldMapping}
            sanitizedCellValue={sanitizedCellValue}
          />
        );
      })}
    </tr>
  );

  // 복호화 함수
  async function decryptRow() {
    if (!row._source) {
      alert('복호화할 데이터가 없습니다.');
      return;
    }

    console.log(row._source);

    try {
      // 복호화 API 호출
      /*
      const response = await fetch('https://consumer-api', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(row._source)
      })

      if (!response.ok) {
        throw new Error("서버 요청 실패" + response.status);
      }

      const result = await response.json();
      */
    
      // 대신 임시 목업 데이터 생성
      // row._source 가 unknown 타입으로 인식되고 있어서, Type Assertion을 통해 타입을 명시적으로 지정
      const source = row._source as Record<string, any>;
      // 이제 목업 데이터를 생성할 때 타입 오류 없이 접근 가능
      const mockDecryptedData: Record<string, any> = { ...source };

      // 원본 데이터의 각 필드를 순회하면서 필드 값이 문자열인 경우에 '복호화됨' 접두사를 추가할 것임
      Object.keys(source).forEach(key => {
        // 필드 값이 문자열인 경우에만 처리
        if (typeof source[key] === 'string') {
          // 필드 값 앞에 '복호화됨: '을 추가
          mockDecryptedData[key] = '복호화됨: ' + source[key];
        }
      })
      
      console.log('원본 row:', row);
      console.log('목업 데이터:', mockDecryptedData);

      // 복호화된 데이터로 상태 업데이트
      // 원본 데이터의 구조를 유지하면서 _source만 복호화된 데이터로 변경
      const updatedValue = ({
        ...row,
        // _id에 '_decrypted' 접미사를 추가하여 doc_viewer_tab의 shouldComponentUpdate에서 강제 업데이트 하도록 설정
        _id: row._id + '_decrypted',
        // _source: result
        _source: mockDecryptedData
      });

      console.log('최종 업데이트될 데이터', updatedValue);
      setDecryptedValue(updatedValue);

      // 테스트용 목업 데이터 성공 메시지 표시
      alert('테스트용 목업 데이터가 성공적으로 복호화되었습니다.');

    } catch (error) {
      alert("복호화 요청 중 오류가 발생했습니다.");
      console.error(error);
    }
  }

  const expandedTableRow = (
    <tr key={'x' + row._id}>
      <td className="osdDocTable__detailsParent" colSpan={columns.length + 1}>
        <EuiFlexGroup gutterSize="m" alignItems="center">
          <EuiFlexItem grow={false} className="osdDocTable__detailsIconContainer">
            <EuiIcon type="folderOpen" />
          </EuiFlexItem>
          <EuiFlexItem>
            <h4
              data-test-subj="docTableRowDetailsTitle"
              className="euiTitle euiTitle--xsmall"
              i18n-id="discover.docTable.tableRow.detailHeading"
              i18n-default-message="Expanded document"
            >
              Expanded document
            </h4>
          </EuiFlexItem>

          {/* ✅ 복호화 버튼 추가 */}
          <EuiButton onClick={decryptRow} size="s" iconType="lockOpen">복호화</EuiButton>

          {/* 복호화 상태 표시 */}
          {decryptedValue && (
            <EuiFlexItem grow={false}>
              <div style={{ color: 'green' }}>복호화됨!</div>
            </EuiFlexItem>
          )}

          <EuiFlexItem>
            <DocViewerLinks hit={row} indexPattern={indexPattern} columns={columns} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <DocViewer
              hit={decryptedValue || row} // 여기서 복호화된 데이터 또는 원본 데이터 전달
              columns={columns}
              indexPattern={indexPattern}
              onRemoveColumn={(columnName: string) => {
                onRemoveColumn(columnName);
                onClose();
              }}
              onAddColumn={(columnName: string) => {
                onAddColumn(columnName);
                onClose();
              }}
              filter={(mapping, value, mode) => {
                onFilter(mapping, value, mode);
                onClose();
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </td>
    </tr>
  );

  return (
    <>
      {tableRow}
      {isExpanded && expandedTableRow}
    </>
  );
};
