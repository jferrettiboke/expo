import { StackNavigationProp } from '@react-navigation/stack';
import { Heading, View, Divider, Spacer, Text } from 'expo-dev-client-components';
import * as React from 'react';
import { BasicButton } from '../components/BasicButton';

import { EASBranchRow, EASEmptyBranchRow } from '../components/EASUpdatesRows';
import { EmptyBranchesMessage } from '../components/EmptyBranchesMessage';
import { FlatList } from '../components/FlatList';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { getRecentRuntime } from '../functions/getRecentlyRuntime';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { Branch, useBranchesForApp } from '../queries/useBranchesForApp';
import { ExtensionsStackParamList } from './ExtensionsStack';

type BranchesScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

export function BranchesScreen({ navigation }: BranchesScreenProps) {
  const { appId } = useUpdatesConfig();
  const {
    data: branches,
    emptyBranches,
    incompatibleBranches,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useBranchesForApp(appId);

  console.log({ emptyBranches, incompatibleBranches, branches });

  function onBranchPress(branchName: string) {
    navigation.navigate('Updates', { branchName });
  }

  function Header() {
    if (branches.length > 0) {
      return (
        <View py="small" px="small">
          <Heading size="small" color="secondary">
            Recently updated branches
          </Heading>
        </View>
      );
    }

    return null;
  }

  function Footer() {
    const latestRuntimeVersion = getRecentRuntime(incompatibleBranches);

    return (
      <View>
        <RecentlyCreatedBranches
          branches={emptyBranches}
          onBranchPress={(branch) => onBranchPress(branch.name)}
        />

        {incompatibleBranches.length > 0 && (
          <View px="small">
            <Text size="small" color="secondary">
              {getIncompatibleBranchMessage(incompatibleBranches.length)}
            </Text>
            {Boolean(latestRuntimeVersion != null) && (
              <>
                <Spacer.Vertical size="small" />
                <Text size="small" color="secondary">
                  {`A recent update was published with runtime version "${latestRuntimeVersion}".`}
                </Text>
              </>
            )}
          </View>
        )}

        {hasNextPage && (
          <BasicButton
            label="Load More"
            isLoading={isFetchingNextPage}
            onPress={() => fetchNextPage()}
          />
        )}
      </View>
    );
  }

  function EmptyList() {
    if (emptyBranches.length === 0) {
      return (
        <View>
          <Spacer.Vertical size="medium" />
          <EmptyBranchesMessage branches={branches} incompatibleBranches={incompatibleBranches} />
        </View>
      );
    }

    return null;
  }

  function renderBranch({ index, item: branch }: { index: number; item: Branch }) {
    const isFirst = index === 0;
    const isLast = index === branches?.length - 1;

    return <EASBranchRow branch={branch} isFirst={isFirst} isLast={isLast} />;
  }

  return (
    <View flex="1" px="medium">
      <FlatList
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => refetch()}
        ListHeaderComponent={Header}
        extraData={{ length: branches.length, hasNextPage }}
        data={branches}
        ItemSeparatorComponent={Divider}
        renderItem={renderBranch}
        keyExtractor={(item) => item?.id}
        ListFooterComponent={Footer}
        ListEmptyComponent={EmptyList}
      />
    </View>
  );
}

type RecentlyCreatedBranchesProps = {
  branches: Branch[];
  onBranchPress: (branch: Branch) => void;
};

function RecentlyCreatedBranches({ branches, onBranchPress }: RecentlyCreatedBranchesProps) {
  if (branches.length === 0) {
    return null;
  }

  return (
    <View>
      <Spacer.Vertical size="medium" />

      <View py="small" px="small">
        <Heading size="small" color="secondary">
          Recently created branches
        </Heading>
      </View>

      {branches.slice(0, 3).map((branch, index, arr) => {
        const isFirst = index === 0;
        const isLast = index === arr?.length - 1;

        return (
          <View key={branch.id}>
            <EASEmptyBranchRow branch={branch} isFirst={isFirst} isLast={isLast} />
            {!isLast && <Divider />}
          </View>
        );
      })}

      <Spacer.Vertical size="small" />
    </View>
  );
}

export function getIncompatibleBranchMessage(numberOfIncompatibleBranches: number) {
  if (numberOfIncompatibleBranches === 1) {
    return `There is 1 branch that is not compatible with this development build. To preview it, download or build a development client that matches its runtime version.`;
  }

  return `There are ${numberOfIncompatibleBranches} branches that are not compatible with this development build. To preview them, download or build a development client that matches their runtime version.`;
}
