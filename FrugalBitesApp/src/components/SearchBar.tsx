import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import debounce from 'lodash/debounce';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  value?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  onSearch,
  onClear,
  value = '',
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState(value);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      onSearch(text);
    }, 300),
    [onSearch]
  );

  const handleChangeText = (text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  const handleClear = () => {
    setSearchText('');
    onSearch('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
      <Ionicons name="search" size={20} color={colors.textTertiary} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder || t('common.search')}
        placeholderTextColor={colors.textTertiary}
        value={searchText}
        onChangeText={handleChangeText}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => onSearch(searchText)}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'offer' | 'merchant' | 'category';
  icon?: string;
}

interface SearchWithSuggestionsProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  suggestions: SearchSuggestion[];
  isLoading?: boolean;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  placeholder,
  onSearch,
  onSelectSuggestion,
  suggestions,
  isLoading = false,
  recentSearches = [],
  onClearRecent,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const debouncedSearch = useCallback(
    debounce((text: string) => {
      if (text.length >= 2) {
        onSearch(text);
      }
    }, 300),
    [onSearch]
  );

  const handleChangeText = (text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchText(suggestion.text);
    setIsFocused(false);
    onSelectSuggestion(suggestion);
  };

  const getIconForType = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'merchant':
        return 'storefront-outline';
      case 'category':
        return 'grid-outline';
      default:
        return 'pricetag-outline';
    }
  };

  const showSuggestions = isFocused && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <View style={styles.searchWithSuggestions}>
      <View style={[styles.container, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder || t('common.search')}
          placeholderTextColor={colors.textTertiary}
          value={searchText}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
        {!isLoading && searchText.length > 0 && (
          <TouchableOpacity onPress={() => handleChangeText('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface }]}>
          {searchText.length < 2 && recentSearches.length > 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {t('common.recentSearches')}
                </Text>
                {onClearRecent && (
                  <TouchableOpacity onPress={onClearRecent}>
                    <Text style={[styles.clearText, { color: colors.primary }]}>
                      {t('common.clear')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {recentSearches.slice(0, 5).map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleChangeText(search)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{search}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Ionicons
                    name={getIconForType(item.type) as any}
                    size={18}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{item.text}</Text>
                  <View style={[styles.typeTag, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.typeTagText, { color: colors.primary }]}>
                      {t(`common.${item.type}`)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  searchWithSuggestions: {
    position: 'relative',
    zIndex: 100,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxHeight: 300,
    overflow: 'hidden',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionsList: {
    flexGrow: 0,
  },
});
